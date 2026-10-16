import os
import uuid
from decimal import Decimal
from datetime import datetime

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

from app.tasks.celery_app import celery_app
from app.database import SessionLocal
from app.models import Order, OrderItem, Product, User
from sqlalchemy.orm import selectinload, joinedload


@celery_app.task(bind=True, name="generate_order_invoice")
def generate_order_invoice(self, order_id: int):
    """
    Celery task that generates a PDF invoice for a given order_id
    and reports live progress back to the Celery backend.
    """
    self.update_state(
        state="PROGRESS",
        meta={
            "current": 10,
            "total": 100,
            "percent": 10,
            "status": f"Initializing invoice generation for Order #{order_id}...",
        },
    )

    db = SessionLocal()
    try:
        self.update_state(
            state="PROGRESS",
            meta={
                "current": 25,
                "total": 100,
                "percent": 25,
                "status": f"Fetching order and line items for Order #{order_id}...",
            },
        )

        order = (
            db.query(Order)
            .options(
                selectinload(Order.items).joinedload(OrderItem.product),
                joinedload(Order.user),
            )
            .filter(Order.id == order_id)
            .first()
        )

        if not order:
            raise ValueError(f"Order #{order_id} not found.")

        self.update_state(
            state="PROGRESS",
            meta={
                "current": 50,
                "total": 100,
                "percent": 50,
                "status": "Composing invoice layout & styling...",
            },
        )

        output_dir = os.path.join("static", "invoices")
        os.makedirs(output_dir, exist_ok=True)

        token = uuid.uuid4().hex[:8]
        filename = f"invoice_order_{order_id}_{token}.pdf"
        filepath = os.path.join(output_dir, filename)

        doc = SimpleDocTemplate(
            filepath,
            pagesize=letter,
            leftMargin=36,
            rightMargin=36,
            topMargin=36,
            bottomMargin=36,
        )

        styles = getSampleStyleSheet()

        # Custom Styles
        title_style = ParagraphStyle(
            "InvoiceTitle",
            parent=styles["Heading1"],
            fontSize=24,
            leading=28,
            textColor=colors.HexColor("#1E272E"),
            fontName="Helvetica-Bold",
        )
        subtitle_style = ParagraphStyle(
            "InvoiceSubtitle",
            parent=styles["Normal"],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor("#6C5CE7"),
            fontName="Helvetica-Bold",
        )
        header_text = ParagraphStyle(
            "HeaderText",
            parent=styles["Normal"],
            fontSize=9,
            leading=13,
            textColor=colors.HexColor("#485460"),
        )
        bold_text = ParagraphStyle(
            "BoldText",
            parent=styles["Normal"],
            fontSize=9,
            leading=13,
            fontName="Helvetica-Bold",
            textColor=colors.HexColor("#1E272E"),
        )
        th_style = ParagraphStyle(
            "TableHeader",
            parent=styles["Normal"],
            fontSize=9,
            leading=12,
            fontName="Helvetica-Bold",
            textColor=colors.white,
        )
        cell_style = ParagraphStyle(
            "TableCell",
            parent=styles["Normal"],
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#2D3436"),
        )
        cell_bold = ParagraphStyle(
            "TableCellBold",
            parent=styles["Normal"],
            fontSize=9,
            leading=12,
            fontName="Helvetica-Bold",
            textColor=colors.HexColor("#2D3436"),
        )

        elements = []

        # Header: Company Info + Invoice Details
        header_data = [
            [
                Paragraph("<b>NEXUS COMMERCE</b>", title_style),
                Paragraph("<b>INVOICE / RECEIPT</b>", title_style),
            ],
            [
                Paragraph(
                    "High-Performance Gear & Modern Tech<br/>support@nexusstore.com | www.nexusstore.com",
                    header_text,
                ),
                Paragraph(
                    f"<b>Invoice #:</b> INV-{order.id:06d}<br/>"
                    f"<b>Order Date:</b> {order.created_at.strftime('%B %d, %Y %H:%M') if order.created_at else datetime.utcnow().strftime('%B %d, %Y')}<br/>"
                    f"<b>Status:</b> {order.status.upper()}",
                    header_text,
                ),
            ],
        ]
        header_table = Table(header_data, colWidths=[4.0 * inch, 3.5 * inch])
        header_table.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                ]
            )
        )
        elements.append(header_table)
        elements.append(Spacer(1, 14))

        elements.append(
            HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#6C5CE7"), spaceBefore=5, spaceAfter=15)
        )

        self.update_state(
            state="PROGRESS",
            meta={
                "current": 70,
                "total": 100,
                "percent": 70,
                "status": "Compiling customer details and order line items...",
            },
        )

        # Customer & Shipping details
        cust_email = order.user.email if order.user else "N/A"
        ship_name = order.shipping_name or "Valued Customer"
        ship_phone = order.shipping_phone or "N/A"
        addr_line = order.shipping_address or "Standard Delivery"
        city_line = f"{order.shipping_city or ''}, {order.shipping_state or ''} {order.shipping_postal_code or ''}".strip()
        if not city_line.strip(","):
            city_line = "Domestic Shipping"

        cust_info = [
            [
                Paragraph("<b>Billed & Shipped To:</b>", bold_text),
                Paragraph("<b>Order Details:</b>", bold_text),
            ],
            [
                Paragraph(
                    f"<b>Name:</b> {ship_name}<br/>"
                    f"<b>Email:</b> {cust_email}<br/>"
                    f"<b>Phone:</b> {ship_phone}<br/>"
                    f"<b>Address:</b> {addr_line}<br/>"
                    f"<b>City/State/Zip:</b> {city_line}",
                    header_text,
                ),
                Paragraph(
                    f"<b>Order Reference ID:</b> #{order.id}<br/>"
                    f"<b>Payment Method:</b> Card / Direct Checkout<br/>"
                    f"<b>Fulfillment:</b> Standard Express (Tracked)<br/>"
                    f"<b>Total Items:</b> {len(order.items)} line item(s)",
                    header_text,
                ),
            ],
        ]
        cust_table = Table(cust_info, colWidths=[4.0 * inch, 3.5 * inch])
        cust_table.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8F9FA")),
                    ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#DFE6E9")),
                    ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#DFE6E9")),
                    ("TOPPADDING", (0, 0), (-1, -1), 8),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                    ("LEFTPADDING", (0, 0), (-1, -1), 10),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ]
            )
        )
        elements.append(cust_table)
        elements.append(Spacer(1, 16))

        # Items Table
        items_data = [
            [
                Paragraph("#", th_style),
                Paragraph("Product / Item Description", th_style),
                Paragraph("Qty", th_style),
                Paragraph("Unit Price", th_style),
                Paragraph("Line Total", th_style),
            ]
        ]

        subtotal = Decimal("0.00")
        for idx, item in enumerate(order.items, start=1):
            prod_name = item.product.name if item.product else f"Product #{item.product_id}"
            qty = item.quantity
            unit_price = Decimal(str(item.price))
            line_total = unit_price * qty
            subtotal += line_total

            items_data.append(
                [
                    Paragraph(str(idx), cell_style),
                    Paragraph(f"<b>{prod_name}</b>", cell_style),
                    Paragraph(str(qty), cell_style),
                    Paragraph(f"${unit_price:,.2f}", cell_style),
                    Paragraph(f"${line_total:,.2f}", cell_bold),
                ]
            )

        items_table = Table(
            items_data,
            colWidths=[0.5 * inch, 4.0 * inch, 0.7 * inch, 1.1 * inch, 1.2 * inch],
        )
        items_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#6C5CE7")),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("ALIGN", (0, 0), (0, -1), "CENTER"),
                    ("ALIGN", (2, 0), (2, -1), "CENTER"),
                    ("ALIGN", (3, 0), (-1, -1), "RIGHT"),
                    ("TOPPADDING", (0, 0), (-1, -1), 7),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
                ]
            )
        )
        elements.append(items_table)
        elements.append(Spacer(1, 14))

        # Summary Table
        grand_total = Decimal(str(order.total_amount))
        summary_data = [
            [Paragraph("Subtotal:", bold_text), Paragraph(f"${subtotal:,.2f}", bold_text)],
            [Paragraph("Shipping:", header_text), Paragraph("FREE", bold_text)],
            [Paragraph("Estimated Tax (Included):", header_text), Paragraph("$0.00", header_text)],
            [
                Paragraph("<b>Grand Total:</b>", ParagraphStyle("GT", parent=bold_text, fontSize=12, textColor=colors.HexColor("#6C5CE7"))),
                Paragraph(f"<b>${grand_total:,.2f}</b>", ParagraphStyle("GTA", parent=bold_text, fontSize=12, textColor=colors.HexColor("#6C5CE7"))),
            ],
        ]
        summary_table = Table(summary_data, colWidths=[2.0 * inch, 1.5 * inch])
        summary_table.setStyle(
            TableStyle(
                [
                    ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("TOPPADDING", (0, 0), (-1, -1), 4),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                    ("LINEABOVE", (0, 3), (-1, 3), 1, colors.HexColor("#6C5CE7")),
                ]
            )
        )

        wrapper_data = [[Paragraph("", header_text), summary_table]]
        wrapper_table = Table(wrapper_data, colWidths=[4.0 * inch, 3.5 * inch])
        wrapper_table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
        elements.append(wrapper_table)
        elements.append(Spacer(1, 20))

        # Footer
        elements.append(
            HRFlowable(width="100%", thickness=0.75, color=colors.HexColor("#DFE6E9"), spaceBefore=10, spaceAfter=10)
        )
        footer_p = Paragraph(
            "Thank you for choosing Nexus Commerce! This document serves as your official purchase confirmation and receipt.<br/>"
            "If you have any questions or require support, please contact us at support@nexusstore.com.",
            ParagraphStyle(
                "FooterText",
                parent=styles["Normal"],
                fontSize=8,
                leading=11,
                textColor=colors.HexColor("#A4B0BE"),
                alignment=1,  # Center
            ),
        )
        elements.append(footer_p)

        self.update_state(
            state="PROGRESS",
            meta={
                "current": 90,
                "total": 100,
                "percent": 90,
                "status": "Compiling and generating PDF document...",
            },
        )

        doc.build(elements)

        web_pdf_url = f"/static/invoices/{filename}"

        self.update_state(
            state="PROGRESS",
            meta={
                "current": 100,
                "total": 100,
                "percent": 100,
                "status": "Invoice generation completed successfully!",
            },
        )

        return {
            "status": "COMPLETED",
            "order_id": order_id,
            "filename": filename,
            "pdf_url": web_pdf_url,
            "download_url": web_pdf_url,
            "file_size": os.path.getsize(filepath),
            "generated_at": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        self.update_state(
            state="FAILURE",
            meta={
                "current": 0,
                "total": 100,
                "percent": 0,
                "status": f"Failed to generate invoice: {str(e)}",
                "error": str(e),
            },
        )
        raise e
    finally:
        db.close()
