import type { Serverless } from 'serverless/aws';

const serverlessConfiguration: Serverless = {
  service: {
    name: 'helesta-monitor',
    // app and org for use with dashboard.serverless.com
    // app: your-app-name,
    // org: your-org-name,
  },
  frameworkVersion: '2',
  custom: {
    webpack: {
      webpackConfig: './webpack.config.js',
      includeModules: true
    }
  },
  // Add the serverless-webpack plugin
  plugins: ['serverless-webpack'],
  provider: {
    name: 'aws',
    runtime: 'nodejs12.x',
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
    },
  },
  functions: {
    playlistWatcher: {
      handler: 'src/handler.playlistWatcher',
      events: [
        {
          schedule: {
            rate: "rate(10 minutes)"
          }
        }
      ]
    },
    subscriberWatcher: {
      handler: 'src/handler.subscriberWatcher',
      events: [
        {
          schedule: {
            rate: "rate(10 minutes)"
          }
        }
      ]
    },
    mentionWatcher: {
      handler: 'src/handler.mentionWatcher',
      events: [
        {
          stream: {
            arn: "arn:aws:dynamodb:us-east-2:934162718050:table/Videos-prod/stream/2019-07-08T02:52:33.221"
          }
        }
      ]
    }
  }
}

module.exports = serverlessConfiguration;
