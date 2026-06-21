declare const process: {
  env: {
    API_URL?: string;
    DELL_URL?: string;
    API_VERSION?: string;
    [key: string]: any;
  };
};

const Config = {
  API_URL: process.env.API_URL,
  DELL_URL: process.env.DELL_URL,
  API_VERSION: process.env.API_VERSION,
};

export default Config;
