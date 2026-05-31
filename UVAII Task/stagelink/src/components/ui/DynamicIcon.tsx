import * as LucideIcons from "lucide-react";
import { LucideProps } from "lucide-react";

interface DynamicIconProps extends LucideProps {
  name: string;
}

export function DynamicIcon({ name, ...props }: DynamicIconProps) {
  // We use type assertion since we index the LucideIcons object
  const Icon = (LucideIcons as any)[name];
  
  if (!Icon) {
    return <LucideIcons.HelpCircle {...props} />;
  }

  return <Icon {...props} />;
}
