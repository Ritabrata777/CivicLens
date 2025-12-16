import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/frontend/components/ui/alert-dialog";
import { Phone, Shield, Ambulance, Flame } from "lucide-react";

type SOSModalProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SOSModal({ isOpen, onOpenChange }: SOSModalProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl text-destructive font-headline flex items-center gap-2">
            <Shield size={24} /> Emergency Contacts
          </AlertDialogTitle>
          <AlertDialogDescription>
            If you are in immediate danger or witness a life-threatening situation, please contact emergency services directly.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 py-4">
          <a href="tel:911" className="flex items-center p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
            <div className="p-3 rounded-full bg-destructive/20 text-destructive mr-4">
              <Phone size={24} />
            </div>
            <div>
              <p className="font-semibold text-lg text-destructive">Police / General Emergency</p>
              <p className="text-muted-foreground text-2xl font-bold">911</p>
            </div>
          </a>
           <a href="tel:911" className="flex items-center p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
            <div className="p-3 rounded-full bg-blue-500/20 text-blue-500 mr-4">
              <Ambulance size={24} />
            </div>
            <div>
              <p className="font-semibold text-lg">Ambulance / Medical</p>
              <p className="text-muted-foreground text-2xl font-bold">911</p>
            </div>
          </a>
           <a href="tel:911" className="flex items-center p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
            <div className="p-3 rounded-full bg-orange-500/20 text-orange-500 mr-4">
              <Flame size={24} />
            </div>
            <div>
              <p className="font-semibold text-lg">Fire Department</p>
              <p className="text-muted-foreground text-2xl font-bold">911</p>
            </div>
          </a>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
