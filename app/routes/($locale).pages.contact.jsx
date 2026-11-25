import {useEffect, useRef, useState} from 'react';
import {
  data,
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
} from 'react-router';
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Package,
  RotateCcw,
  Truck,
} from 'lucide-react';
import {Link} from '~/components/Link';
import {Button} from '~/components/ui/button';
import {Input} from '~/components/ui/input';
import {Label} from '~/components/ui/label';
import {Textarea} from '~/components/ui/textarea';
import {pageTitle} from '~/lib/meta';
import {
  CONTACT_TOPICS,
  HONEYPOT_FIELD,
  MESSAGE_MAX_LENGTH,
} from '~/lib/contact';
import {parseContactForm, sendContactEmail} from '~/lib/contact.server';

/**
 * This route is more specific than `pages.$handle`, so it owns
 * /pages/contact. A Shopify page with the handle `contact` is still read for
 * its intro copy and SEO, so the merchant can edit them in Shopify admin →
 * Online Store → Pages without a deploy.
 */

/**
 * @type {Route.MetaFunction}
 */
export const meta = ({data, matches}) => {
  const description =
    data?.page?.seo?.description ??
    'Questions about an order, returns or sizing? Send us a message and we will get back to you.';
  return [
    {title: pageTitle(matches, data?.page?.seo?.title ?? 'Contact')},
    {name: 'description', content: description},
  ];
};

/**
 * @param {Route.LoaderArgs}
 */
export async function loader({context}) {
  const {page} = await context.storefront.query(CONTACT_PAGE_QUERY, {
    variables: {handle: 'contact'},
    cache: context.storefront.CacheLong(),
  });

  return {page};
}

/**
 * @param {Route.ActionArgs}
 */
export async function action({request, context}) {
  if (request.method !== 'POST') {
    return data({error: 'Method not allowed'}, {status: 405});
  }

  const {values, errors, isSpam} = parseContactForm(await request.formData());

  // Bots fill the hidden field. Pretend it worked so they don't retry.
  if (isSpam) return {ok: true};

  if (errors) {
    return data({ok: false, errors, values}, {status: 400});
  }

  const {shop} = await context.storefront.query(SHOP_NAME_QUERY, {
    cache: context.storefront.CacheLong(),
  });

  const result = await sendContactEmail(values, {
    env: context.env,
    shopName: shop?.name,
    request,
  });

  if (!result.ok) {
    return data(
      {
        ok: false,
        values,
        formError:
          'We couldn’t send your message just now. Please try again in a few minutes.',
      },
      {status: result.reason === 'not_configured' ? 503 : 502},
    );
  }

  return {ok: true, firstName: values.name.split(' ')[0]};
}

export default function ContactPage() {
  /** @type {LoaderReturnData} */
  const {page} = useLoaderData();
  /** @type {ActionReturnData | undefined} */
  const actionData = useActionData();

  // Hide the success panel when the visitor chooses to write another message;
  // a new submission brings a new actionData object, which shows it again.
  const [dismissedResult, setDismissedResult] = useState(null);
  const showSuccess = actionData?.ok && dismissedResult !== actionData;

  return (
    <div className="py-10 md:py-16">
      <header className="max-w-2xl">
        <p className="m-0 text-sm font-semibold tracking-wide text-indigo uppercase">
          Contact
        </p>
        <h1 className="mt-2 mb-4 text-3xl leading-tight font-bold tracking-tight md:text-4xl">
          {page?.title && page.title.toLowerCase() !== 'contact'
            ? page.title
            : 'How can we help?'}
        </h1>
        {page?.body ? (
          <div
            className="text-base text-muted [&_a]:underline [&_p+p]:mt-3"
            dangerouslySetInnerHTML={{__html: page.body}}
          />
        ) : (
          <p className="text-base text-muted">
            Questions about an order, a return or finding your size? Send us a
            message and a real person will get back to you.
          </p>
        )}
      </header>

      <div className="mt-10 grid gap-8 md:mt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-12">
        <HelpLinks />

        <div className="rounded-xl border bg-paper p-5 shadow-sm md:p-8">
          {showSuccess ? (
            <SuccessMessage
              firstName={actionData.firstName}
              onReset={() => setDismissedResult(actionData)}
            />
          ) : (
            <ContactForm actionData={actionData?.ok ? undefined : actionData} />
          )}
        </div>
      </div>
    </div>
  );
}

function HelpLinks() {
  const links = [
    {
      to: '/account/orders',
      icon: Package,
      title: 'Track an order',
      description: 'Sign in to see order status and tracking.',
    },
    {
      to: '/policies/refund-policy',
      icon: RotateCcw,
      title: 'Returns and refunds',
      description: 'How to send something back.',
    },
    {
      to: '/policies/shipping-policy',
      icon: Truck,
      title: 'Shipping',
      description: 'Delivery times and costs.',
    },
  ];

  return (
    <aside aria-labelledby="help-heading" className="flex flex-col gap-6">
      <div>
        <h2 id="help-heading" className="mb-1 text-lg font-semibold">
          Quick answers
        </h2>
        <p className="text-sm text-muted">
          These might sort it out faster than waiting for a reply.
        </p>
      </div>

      <ul className="m-0 flex flex-col gap-3">
        {links.map(({to, icon: Icon, title, description}) => (
          <li key={to} className="m-0">
            <Link
              to={to}
              prefetch="intent"
              className="group flex items-start gap-4 rounded-xl bg-mist p-4 transition-colors hover:bg-line/60 hover:no-underline"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-paper text-ink">
                <Icon aria-hidden className="size-5" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-semibold">{title}</span>
                <span className="text-sm text-muted">{description}</span>
              </span>
              <ArrowUpRight
                aria-hidden
                className="mt-1 size-4 shrink-0 text-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
              />
            </Link>
          </li>
        ))}
      </ul>

      <p className="flex items-center gap-2 text-sm text-muted">
        <Clock aria-hidden className="size-4 shrink-0" />
        We reply within 1–2 business days.
      </p>
    </aside>
  );
}

/**
 * @param {{actionData?: Exclude<ActionReturnData, {ok: true}>}}
 */
function ContactForm({actionData}) {
  const navigation = useNavigation();
  const isSubmitting =
    navigation.state === 'submitting' && navigation.formMethod === 'POST';

  const errors = actionData?.errors ?? {};
  const values = actionData?.values ?? {};
  const formRef = useRef(null);
  const formErrorRef = useRef(null);

  // Move focus to the first invalid field, or to the send error, so keyboard
  // and screen reader users land on what needs fixing.
  useEffect(() => {
    if (!actionData) return;
    const firstInvalid = formRef.current?.querySelector(
      '[aria-invalid="true"]',
    );
    if (firstInvalid) firstInvalid.focus();
    else if (actionData.formError) formErrorRef.current?.focus();
  }, [actionData]);

  /**
   * @param {keyof typeof values} name
   */
  const fieldProps = (name) => ({
    id: `contact-${name}`,
    name,
    defaultValue: values[name] ?? '',
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `contact-${name}-error` : undefined,
  });

  return (
    <Form
      ref={formRef}
      method="post"
      noValidate
      className="m-0 flex max-w-none flex-col gap-5"
      aria-labelledby="contact-form-heading"
    >
      <h2 id="contact-form-heading" className="m-0 text-lg font-semibold">
        Send us a message
      </h2>

      {actionData?.formError && (
        <p
          ref={formErrorRef}
          tabIndex={-1}
          role="alert"
          className="rounded-lg border border-apple/30 bg-apple/5 px-4 py-3 text-sm text-ink"
        >
          {actionData.formError}
        </p>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Name" error={errors.name} htmlFor="contact-name">
          <Input
            {...fieldProps('name')}
            autoComplete="name"
            required
            maxLength={100}
          />
        </Field>
        <Field label="Email" error={errors.email} htmlFor="contact-email">
          <Input
            {...fieldProps('email')}
            type="email"
            autoComplete="email"
            inputMode="email"
            required
          />
        </Field>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Topic" error={errors.topic} htmlFor="contact-topic">
          <select
            {...fieldProps('topic')}
            required
            className="m-0 h-10 w-full rounded-md border border-input bg-paper px-3 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive md:text-sm"
          >
            <option value="" disabled>
              Choose a topic
            </option>
            {CONTACT_TOPICS.map((topic) => (
              <option key={topic.value} value={topic.value}>
                {topic.label}
              </option>
            ))}
          </select>
        </Field>
        <Field
          label="Order number"
          optional
          error={errors.orderNumber}
          htmlFor="contact-orderNumber"
        >
          <Input
            {...fieldProps('orderNumber')}
            placeholder="#1001"
            maxLength={30}
          />
        </Field>
      </div>

      <Field label="Message" error={errors.message} htmlFor="contact-message">
        <Textarea
          {...fieldProps('message')}
          rows={6}
          required
          minLength={10}
          maxLength={MESSAGE_MAX_LENGTH}
        />
      </Field>

      {/* Honeypot: hidden from people and assistive tech, filled by bots. */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] h-px w-px overflow-hidden"
      >
        <label htmlFor={`contact-${HONEYPOT_FIELD}`}>Company</label>
        <input
          id={`contact-${HONEYPOT_FIELD}`}
          name={HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      <div className="flex flex-col-reverse items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          We only use your details to reply. See our{' '}
          <Link to="/policies/privacy-policy" className="underline">
            privacy policy
          </Link>
          .
        </p>
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? 'Sending…' : 'Send message'}
        </Button>
      </div>
    </Form>
  );
}

/**
 * @param {{
 *   label: string;
 *   htmlFor: string;
 *   error?: string;
 *   optional?: boolean;
 *   children: React.ReactNode;
 * }}
 */
function Field({label, htmlFor, error, optional = false, children}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>
        {label}
        {optional && <span className="font-normal text-muted">(optional)</span>}
      </Label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="text-sm text-apple">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * @param {{firstName?: string; onReset: () => void}}
 */
function SuccessMessage({firstName, onReset}) {
  const headingRef = useRef(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div
      role="status"
      className="flex flex-col items-start gap-4 py-6 md:py-10"
    >
      <CheckCircle2 aria-hidden className="size-10 text-court" />
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="m-0 text-2xl font-bold tracking-tight outline-none"
      >
        Thanks{firstName ? `, ${firstName}` : ''}! Your message is on its way.
      </h2>
      <p className="text-muted">
        We’ll reply to the email address you gave us within 1–2 business days.
      </p>
      <div className="mt-2 flex flex-wrap gap-3">
        <Button asChild>
          <Link to="/collections" className="hover:no-underline">
            Keep shopping
          </Link>
        </Button>
        <Button type="button" variant="outline" onClick={onReset}>
          Send another message
        </Button>
      </div>
    </div>
  );
}

const CONTACT_PAGE_QUERY = `#graphql
  query ContactPage(
    $language: LanguageCode,
    $country: CountryCode,
    $handle: String!
  )
  @inContext(language: $language, country: $country) {
    page(handle: $handle) {
      id
      title
      body
      seo {
        title
        description
      }
    }
  }
`;

const SHOP_NAME_QUERY = `#graphql
  query ContactShopName(
    $language: LanguageCode,
    $country: CountryCode
  )
  @inContext(language: $language, country: $country) {
    shop {
      name
    }
  }
`;

/** @typedef {import('./+types/pages.contact').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
/** @typedef {ReturnType<typeof useActionData<typeof action>>} ActionReturnData */
