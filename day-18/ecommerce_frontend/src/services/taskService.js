import api from "./api";

/**
 * Polls the current state of a Celery background task.
 * @param {string} taskId
 * @returns {Promise<{task_id: string, state: string, progress: number, status: string, result: any, error: string|null}>}
 */
export const getTaskStatus = async (taskId) => {
  const response = await api.get(`/tasks/${taskId}/status`);
  return response.data;
};

/**
 * Dispatches a Celery task to generate an order invoice PDF.
 * @param {number|string} orderId
 * @returns {Promise<{task_id: string, order_id: number, message: string}>}
 */
export const generateOrderInvoice = async (orderId) => {
  const response = await api.post(`/tasks/generate-invoice/${orderId}`);
  return response.data;
};

/**
 * Dispatches a Celery task to bulk import products from a CSV file.
 * @param {File} file
 * @returns {Promise<{task_id: string, filename: string, message: string}>}
 */
export const bulkImportCsv = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/tasks/import-csv", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

/**
 * Downloads the sample CSV template directly from the backend.
 */
export const downloadCsvTemplate = async () => {
  const response = await api.get("/tasks/csv-template", {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: "text/csv" }));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "products_import_template.csv");
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
