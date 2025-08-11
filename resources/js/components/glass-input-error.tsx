import { HTMLAttributes } from 'react';

export default function GlassInputError({ message, className = '', ...props }: HTMLAttributes<HTMLParagraphElement> & { message?: string }) {
    return message ? (
        <p {...props} className={`glass-error ${className}`}>
            {message}
        </p>
    ) : null;
}