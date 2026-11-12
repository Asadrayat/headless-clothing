import {redirect} from 'react-router';
import {localizePath} from '~/lib/i18n';

export async function loader({context}) {
  return redirect(
    localizePath('/account/orders', context.storefront.i18n.pathPrefix),
  );
}

/** @typedef {ReturnType<typeof useLoaderData<typeof loader>>} LoaderReturnData */
