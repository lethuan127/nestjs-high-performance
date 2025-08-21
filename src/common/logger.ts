import { ClsServiceManager } from 'nestjs-cls';
import * as winston from 'winston';
import { ContextStore } from './context';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const contextTransform: winston.Logform.TransformFunction = (info, opts?: any) => {
  const clsService = ClsServiceManager.getClsService<ContextStore>();
  if (!clsService) {
    return info;
  }
  info.requestId = clsService.getId();
  info.userId = clsService.get('userId');
  return info;
};

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(winston.format(contextTransform)(), winston.format.json()),
  transports: [new winston.transports.Console()],
});

export default logger;
