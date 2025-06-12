import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function UserInfo() {
  const userName = "Doulat";
  const userEmail = "mddoulat@gmail.com";

  return (
    <div className="p-6 rounded-lg shadow-md bg-card text-card-foreground">
      <div className="flex items-center space-x-4 mb-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src="https://placehold.co/64x64.png" alt={userName} data-ai-hint="profile person" />
          <AvatarFallback>{userName.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-headline font-semibold">Good morning, {userName}!</h2>
          <p className="text-sm text-muted-foreground">{userEmail}</p>
        </div>
      </div>
      <p className="text-muted-foreground">
        Welcome to Your Dashboard – Here's an overview of your activity, ongoing campaigns, and platform impact.
      </p>
    </div>
  );
}
