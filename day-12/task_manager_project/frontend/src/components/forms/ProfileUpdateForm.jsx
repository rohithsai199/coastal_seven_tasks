import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDropzone } from 'react-dropzone';
import { Camera, Check, ChevronRight, ChevronLeft, UploadCloud, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const profileFormSchema = z.object({
  username: z
    .string()
    .min(2, { message: 'Username must be at least 2 characters.' })
    .max(30, { message: 'Username must not be longer than 30 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  bio: z.string().max(160).optional(),
  file: z.any().optional(),
});

export function ProfileUpdateForm({ onSuccess, defaultValues }) {
  const [step, setStep] = useState(1);
  const [previewImage, setPreviewImage] = useState(null);

  const form = useForm({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      username: defaultValues?.username || '',
      email: defaultValues?.email || '',
      bio: '',
      file: null,
    },
    mode: 'onChange',
  });

  const { isSubmitting } = form.formState;

  const onDrop = React.useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file) {
        form.setValue('file', file, { shouldValidate: true });
        setPreviewImage(URL.createObjectURL(file));
      }
    },
    [form]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
  });

  const removeImage = (e) => {
    e.stopPropagation();
    form.setValue('file', null, { shouldValidate: true });
    setPreviewImage(null);
  };

  const nextStep = async () => {
    const fieldsToValidate = step === 1 ? ['username', 'email'] : [];
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) setStep((s) => s + 1);
  };

  const prevStep = () => {
    setStep((s) => s - 1);
  };

  const onSubmit = async (values) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log('Form Values:', values);
    if (onSuccess) onSuccess(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted -z-10 rounded-full" />
          <div
            className={cn(
              'absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 transition-all duration-300 rounded-full',
              step === 1 ? 'w-0' : 'w-full'
            )}
          />
          {[1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors border-2',
                step === i
                  ? 'bg-primary text-primary-foreground border-primary'
                  : step > i
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-muted'
              )}
            >
              {step > i ? <Check className="w-4 h-4" /> : i}
            </div>
          ))}
        </div>

        {/* Step 1: Basic Info */}
        <div className={cn('space-y-4 transition-all', step !== 1 && 'hidden')}>
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="johndoe" {...field} />
                </FormControl>
                <FormDescription>This is your public display name.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Step 2: Avatar & Bio */}
        <div className={cn('space-y-6 transition-all', step !== 2 && 'hidden')}>
          <FormField
            control={form.control}
            name="file"
            render={() => (
              <FormItem>
                <FormLabel>Profile Picture</FormLabel>
                <FormControl>
                  <div
                    {...getRootProps()}
                    className={cn(
                      'border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors',
                      isDragActive
                        ? 'border-primary bg-primary/5'
                        : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                    )}
                  >
                    <input {...getInputProps()} />
                    {previewImage ? (
                      <div className="relative group">
                        <img
                          src={previewImage}
                          alt="Preview"
                          className="w-24 h-24 rounded-full object-cover border"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground">
                        <div className="p-3 bg-muted rounded-full mb-2">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-medium">Click or drag image to upload</p>
                        <p className="text-xs">SVG, PNG, JPG or GIF (max. 2MB)</p>
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Input placeholder="Tell us about yourself" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Navigation Actions */}
        <div className="flex justify-between pt-4 border-t border-border">
          {step === 2 ? (
            <Button type="button" variant="outline" onClick={prevStep}>
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          ) : (
            <div /> // Spacer
          )}

          {step === 1 ? (
            <Button type="button" onClick={nextStep}>
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Camera className="w-4 h-4 mr-2 animate-pulse" />}
              {isSubmitting ? 'Saving...' : 'Save Profile'}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
