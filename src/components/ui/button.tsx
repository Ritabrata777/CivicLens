import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium",
    "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",

    // ultra-smooth motion
    "transition-[transform,box-shadow,background-position] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
  ),
  {
    variants: {
      variant: {
        default: cn(
          "text-primary-foreground",

          // base gradient (blue-forward)
          "bg-[linear-gradient(15deg,#2F3BFF_0%,#FF3232_40%,#000080_75%,#000080_100%)]",
          "bg-[length:300%_300%]",
          "bg-[position:0%_50%]",
          "hover:animate-[civic-gradient-drift_20s_ease-in-out_infinite]",

          // hover modulation (not replacement)
          "hover:shadow-[0_4px_10px_rgba(47,59,255,100)]",
          "hover:bg-[position:180%_10%]"
        ),

        outline: cn(
          "border border-input text-foreground",

          "bg-[linear-gradient(135deg,rgba(47,59,255,0.15)_0%,rgba(58,41,255,0.15)_45%,rgba(255,148,180,0.15)_75%,rgba(255,50,50,0.15)_100%)]",
          "bg-[length:300%_300%]",
          "bg-[position:0%_50%]",
          "hover:animate-[civic-gradient-drift_20s_ease-in-out_infinite]",

          "hover:shadow-[0_4px_10px_rgba(47,59,255,100)]",
          "hover:bg-[position:150%_50%]"
        ),

        ghost: cn(
          "border border-input text-foreground",

          "bg-[linear-gradient(135deg,rgba(47,59,255,0.15)_0%,rgba(58,41,255,0.15)_45%,rgba(255,148,180,0.15)_75%,rgba(255,50,50,0.15)_100%)]",
          "bg-[length:300%_300%]",
          "bg-[position:0%_50%]",
          "hover:animate-[civic-gradient-drift_20s_ease-in-out_infinite]",

          "hover:shadow-[0_4px_10px_rgba(47,59,255,100)]",
          "hover:bg-[position:150%_50%]"
        ),

        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",

        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",

        link:
          "text-primary underline-offset-4 hover:underline hover:opacity-90",
      },

      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)


export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }