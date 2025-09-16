export const CompoundEntityRef = {
  parse: (ref) => {
    // Simple mock implementation
    const parts = ref.split(':');
    if (parts.length === 2) {
      const [kind, rest] = parts;
      const [namespace, name] = rest.split('/');
      return { kind, namespace, name };
    }
    return null;
  },
};

export const DEFAULT_NAMESPACE = 'default';
