import {cn} from 'cn';

/**
 * shadcn/ui (new-york) textarea.
 * @param {React.ComponentProps<'textarea'>}
 */
function Textarea({className, ...props}) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'm-0 flex min-h-32 w-full rounded-md border border-input bg-paper px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted md:text-sm',
        'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export {Textarea};
