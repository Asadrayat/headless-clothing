import {cn} from 'cn';

/**
 * shadcn/ui (new-york) text input. `m-0` cancels the margins that the base
 * layer in tailwind.css still gives every bare <input>.
 * @param {React.ComponentProps<'input'>}
 */
function Input({className, type, ...props}) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'm-0 flex h-10 w-full min-w-0 rounded-md border border-input bg-paper px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted md:text-sm',
        'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

export {Input};
