
"use client";

import React, { useState, useRef } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface ImageCropDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string | null;
  onCropComplete: (croppedBlob: Blob) => void;
  aspectRatio?: number; // e.g., 16 / 9 or 600 / 400
  targetWidth?: number; // e.g. 600
  targetHeight?: number; // e.g. 400
}

const ImageCropDialog: React.FC<ImageCropDialogProps> = ({
  isOpen,
  onClose,
  imageSrc,
  onCropComplete,
  aspectRatio = 600 / 400, // Default to 600x400 aspect ratio
  targetWidth = 600,
  targetHeight = 400,
}) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    const newCrop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90, // Initial crop selection width
        },
        aspectRatio,
        width,
        height
      ),
      width,
      height
    );
    setCrop(newCrop);
    setCompletedCrop(newCrop); // Also set completedCrop here to initialize
  }

  async function handleCropImage() {
    if (!completedCrop || !imgRef.current) {
      console.error('Crop or image ref is not available.');
      return;
    }
    setIsCropping(true);

    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    // Calculate the crop dimensions based on the target size and aspect ratio
    // This part determines the source region from the original image
    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    // Set canvas dimensions to the target output size
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('Failed to get canvas context.');
      setIsCropping(false);
      return;
    }

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0, // Destination x on canvas
      0, // Destination y on canvas
      targetWidth, // Destination width on canvas
      targetHeight // Destination height on canvas
    );

    canvas.toBlob((blob) => {
      if (blob) {
        onCropComplete(blob);
      } else {
        console.error('Failed to create blob from canvas.');
      }
      setIsCropping(false);
      onClose(); // Close dialog after processing
    }, 'image/png', 0.9); // Use PNG for better quality, adjust quality if needed
  }
  
  if (!imageSrc) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Crop Your Image</DialogTitle>
        </DialogHeader>
        <div className="my-4 flex justify-center">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspectRatio}
            minWidth={100} // Minimum pixel width for crop selection
            minHeight={100 / aspectRatio} 
            circularCrop={false}
            className="max-w-full max-h-[60vh]"
          >
            <img
              ref={imgRef}
              alt="Crop me"
              src={imageSrc}
              onLoad={onImageLoad}
              style={{ maxHeight: '70vh', objectFit: 'contain' }}
            />
          </ReactCrop>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isCropping}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleCropImage} disabled={!completedCrop || isCropping}>
            {isCropping && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Crop & Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageCropDialog;
