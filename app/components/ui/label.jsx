import {cn} from 'cn';

/**
 * shadcn/ui (new-york) label, as a plain <label> so it needs no extra Radix
 * package.
 * @param {React.ComponentProps<'label'>}
 */
function Label({className, ...props}) {
  return (
    // eslint-disable-next-line jsx-a11y/label-has-associated-control -- callers pass htmlFor
    <label
      data-slot="label"
      className={cn(
        'flex items-center gap-2 text-sm leading-none font-medium select-none',
        className,
      )}
      {...props}
    />
  );
}

export {Label};
