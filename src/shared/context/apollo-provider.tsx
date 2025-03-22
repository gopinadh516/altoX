// filepath: d:\workspace\altoX\src\shared\context\apollo-provider.tsx
import React from 'react';
import { ApolloProvider, ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: 'https://your-graphql-endpoint.com/graphql',
});

const authLink = setContext((_: any, { headers }: { headers?: Record<string, any> }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  }
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache()
});

const ApolloProviderComponent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ApolloProvider client={client}>
    {children}
  </ApolloProvider>
);

export default ApolloProviderComponent;