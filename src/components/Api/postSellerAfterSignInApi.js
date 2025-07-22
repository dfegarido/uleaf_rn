export const postSellerAfterSignInApi = async idToken => {
  try {
    const response = await fetch(
      'https://signinsupplier-nstilwgvua-uc.a.run.app',
      {
        method: 'POST', // or 'POST' if your function expects a body
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`, // Pass token in Authorization header
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.log('postSellerAfterSignInApi error:', error.message);
    throw error; // optionally rethrow for use in UI
  }
};
