import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { auctionsApi } from '@/lib/api';
import { AxiosError } from 'axios';
import type { ApiError } from '@/types';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, setHours, setMinutes } from 'date-fns';
import { CalendarIcon, Loader2, ImageIcon, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { z } from 'zod';

const createAuctionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100, 'Title is too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description is too long'),
  startingPrice: z.number().min(0.01, 'Starting price must be greater than 0'),
  endsAt: z.date().refine((date) => date > new Date(), 'End date must be in the future'),
});

export default function CreateAuctionPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    startingPrice: '',
  });
  const [endDate, setEndDate] = useState<Date>();
  const [endTime, setEndTime] = useState('12:00');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string>('');


  // Recommended settings for smaller payload
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
  const MAX_IMAGE_WIDTH = 1200; // Reduced from 1920
  const MAX_IMAGE_HEIGHT = 800;  // Reduced from 1080
  const COMPRESSION_QUALITY = 0.6; // Reduced to 60%

  // Compress and resize image
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        reject(new Error(`Image size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions maintaining aspect ratio
          if (width > MAX_IMAGE_WIDTH || height > MAX_IMAGE_HEIGHT) {
            const ratio = Math.min(MAX_IMAGE_WIDTH / width, MAX_IMAGE_HEIGHT / height);
            width = width * ratio;
            height = height * ratio;
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Draw and compress image
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', COMPRESSION_QUALITY);

          // Check if compressed size is still too large (should be much smaller)
          const base64Length = compressedDataUrl.length;
          const sizeInMB = (base64Length * 3) / 4 / (1024 * 1024); // Approximate size

          if (sizeInMB > 2) { // If still over 2MB after compression
            reject(new Error('Image is too large even after compression. Please use a smaller image.'));
            return;
          }

          resolve(compressedDataUrl);
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImagePreview(null);
      setImageError('');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file');
      setImagePreview(null);
      return;
    }

    // Validate file size before processing
    if (file.size > MAX_FILE_SIZE) {
      setImageError(`Image size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      setImagePreview(null);
      return;
    }

    setImageError('');
    try {
      const compressedImage = await compressImage(file);
      setImagePreview(compressedImage);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process image';
      setImageError(errorMessage.toLowerCase());
      setImagePreview(null);
      toast({
        title: 'Image processing failed',
        description: errorMessage.toLowerCase(),
        variant: 'destructive',
      });
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  const getEndsAt = (): Date | null => {
    if (!endDate) return null;
    const [hours, minutes] = endTime.split(':').map(Number);
    return setMinutes(setHours(endDate, hours), minutes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const endsAt = getEndsAt();
    const data: {
      title: string;
      description: string;
      startingPrice: number;
      endsAt: Date;
      imageUrl?: string;
    } = {
      title: form.title.trim(),
      description: form.description.trim(),
      startingPrice: parseFloat(form.startingPrice) || 0,
      endsAt: endsAt!,
    };

    // Only include imageUrl if an image was uploaded
    if (imagePreview) {
      data.imageUrl = imagePreview;
    }

    const result = createAuctionSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      const auction = await auctionsApi.create({
        ...data,
        endsAt: data.endsAt.toISOString(),
      });
      toast({ title: 'Auction created!', description: 'Your auction is now live' });
      // Invalidate auctions queries to refresh the lists
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
      queryClient.invalidateQueries({ queryKey: ['my-auctions'] });
      navigate('/auctions');
    } catch (error) {
      const axiosError = error as AxiosError<ApiError>;
      const message = axiosError.response?.data?.message || axiosError.message || 'please try again';
      toast({
        title: 'Failed to create auction',
        description: message.toLowerCase(),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const endsAt = getEndsAt();

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <Button variant="ghost" size="sm" onClick={() => navigate('/auctions')} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Auctions
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Create Auction</CardTitle>
              <CardDescription>List a new item for auction</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="What are you selling?"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    disabled={isLoading}
                  />
                  {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your item in detail..."
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    disabled={isLoading}
                  />
                  {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                </div>

                {/* <div className="space-y-2">
                  <Label htmlFor="image">Auction Image (Optional)</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isLoading}
                  />
                  {imageError && (
                    <p className="text-sm text-destructive">{imageError}</p>
                  )}
                  {imagePreview && !imageError && (
                    <p className="text-xs text-muted-foreground">
                      Image loaded and compressed successfully
                    </p>
                  )}
                </div> */}

                <div className="space-y-2">
                  <Label htmlFor="price">Starting Price</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={form.startingPrice}
                      onChange={(e) => setForm({ ...form, startingPrice: e.target.value })}
                      className="pl-7"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.startingPrice && <p className="text-sm text-destructive">{errors.startingPrice}</p>}
                </div>

                <div className="space-y-2">
                  <Label>End Date & Time</Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'flex-1 justify-start text-left font-normal',
                            !endDate && 'text-muted-foreground'
                          )}
                          disabled={isLoading}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-32"
                      disabled={isLoading}
                    />
                  </div>
                  {errors.endsAt && <p className="text-sm text-destructive">{errors.endsAt}</p>}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Auction
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Preview */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Preview</h3>
            <Card>
              {/* <div className="aspect-video bg-muted flex items-center justify-center rounded-t-lg overflow-hidden">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  )}
                </div> */}
              <CardContent className="p-4">
                <h4 className="font-semibold text-lg">
                  {form.title || 'Your auction title'}
                </h4>
                <p className="text-muted-foreground text-sm mt-2 line-clamp-3">
                  {form.description || 'Your auction description will appear here...'}
                </p>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Starting Price</p>
                      <p className="text-xl font-bold text-primary">
                        ${form.startingPrice ? parseFloat(form.startingPrice).toLocaleString() : '0.00'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Ends</p>
                      <p className="text-sm font-medium">
                        {endsAt ? format(endsAt, 'PPP p') : 'Select date & time'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
