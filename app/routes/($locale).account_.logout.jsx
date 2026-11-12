import {redirect} from 'react-router';
import {localizePath} from '~/lib/i18n';

// if we don't implement this, /account/logout will get caught by account.$.tsx to do login

export async function loader({context}) {
  return redirect(localizePath('/', context.storefront.i18n.pathPrefix));
}

/**
 * @param {Route.ActionArgs}
 */
export async function action({context}) {
  return context.customerAccount.logout();
}

/** @typedef {import('./+types/account_.logout').Route} Route */
/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
/** @typedef {ReturnType<typeof useActionData<typeof action>>} ActionReturnData */
