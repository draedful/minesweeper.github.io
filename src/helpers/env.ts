interface ENVIRONMENT extends NodeJS.ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test',
    REACT_APP_WS_URL: string,
}

const ENV = process.env as ENVIRONMENT;

export const WS_SERVER: string = ENV.REACT_APP_WS_URL;
