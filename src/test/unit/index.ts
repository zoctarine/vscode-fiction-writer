export const unique = (value: string) => value + ': ' + Math.random().toString(36);

export function each<T>(values: Array<T>) {
  return (message: string, cb: (val: T) => void) => {

    values.forEach(value => {
      let search = '%s';
      let replace = value;

      // serch custom field syntax
      const field = /%s\.([a-zA-Z0-9._]+)/g.exec(message);
      if (field && field.length > 1) {
        const newValue = (value as { [key: string]: any });
        if (newValue) {
          search = field[0];
          replace = newValue[field[1]];
        }
      }

      // do the actual test
      it(message.replace(search, `${replace}`), () => {
        cb(value);
      });
    });
  };
};