
"use client"

import * as React from "react"
import { Eye, EyeOff, Check, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface PasswordInputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    showStrength?: boolean
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ className, showStrength = false, value, onChange, ...props }, ref) => {
        const [showPassword, setShowPassword] = React.useState(false)
        const [strength, setStrength] = React.useState(0)

        // Requirements
        const requirements = [
            { re: /.{8,}/, label: "En az 8 karakter" },
            { re: /[0-9]/, label: "En az 1 rakam" },
            { re: /[a-z]/, label: "En az 1 küçük harf" },
            { re: /[A-Z]/, label: "En az 1 büyük harf" },
        ]

        React.useEffect(() => {
            if (!showStrength || typeof value !== 'string') return;

            let score = 0;
            requirements.forEach(req => {
                if (req.re.test(value)) score++;
            });
            setStrength(score);
        }, [value, showStrength]);

        return (
            <div className="relative">
                <Input
                    type={showPassword ? "text" : "password"}
                    className={cn("pr-10", className)}
                    ref={ref}
                    value={value}
                    onChange={onChange}
                    {...props}
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                >
                    {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    )}
                    <span className="sr-only">
                        {showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                    </span>
                </Button>

                {showStrength && typeof value === 'string' && value.length > 0 && (
                    <div className="mt-3 space-y-2">
                        <div className="flex h-1 w-full overflow-hidden rounded-full bg-muted">
                            <div
                                className={cn("h-full transition-all duration-300",
                                    strength <= 1 ? "bg-red-500 w-1/4" :
                                        strength === 2 ? "bg-orange-500 w-2/4" :
                                            strength === 3 ? "bg-yellow-500 w-3/4" :
                                                "bg-green-500 w-full"
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                            {requirements.map((req, i) => (
                                <div key={i} className={cn("flex items-center gap-1", req.re.test(value) ? "text-green-600" : "")}>
                                    {req.re.test(value) ? <Check className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border" />}
                                    {req.label}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )
    }
)
PasswordInput.displayName = "PasswordInput"
