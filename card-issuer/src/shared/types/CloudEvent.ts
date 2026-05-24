export type CloudEvent<T> = {
  id: string;
  source: string;
  specversion: '1.0';
  type: string;
  datacontenttype: 'application/json';
  time: string;
  data: T;
};

