import { BullMQInstrumentation } from '@appsignal/opentelemetry-instrumentation-bullmq';
import { OTLPMetricExporter as OTLPMetricExporterGrpc } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-proto';
import { OTLPTraceExporter as OTLPTraceExporterGrpc } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { NestInstrumentation } from '@opentelemetry/instrumentation-nestjs-core';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { RuntimeNodeInstrumentation } from '@opentelemetry/instrumentation-runtime-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import type { FastifyRequest } from 'fastify';
import { ClientRequest, IncomingMessage, ServerResponse } from 'http';
import logger from './common/logger';
import configService from './config/config.service';

const OTEL_EXPORTER_OTLP_HTTP_ENDPOINT = configService.get('OTEL_EXPORTER_OTLP_HTTP_ENDPOINT') as string;
const OTEL_EXPORTER_OTLP_GRPC_ENDPOINT = configService.get('OTEL_EXPORTER_OTLP_GRPC_ENDPOINT') as string;

if (!OTEL_EXPORTER_OTLP_HTTP_ENDPOINT && !OTEL_EXPORTER_OTLP_GRPC_ENDPOINT) {
  logger.warn('OTEL_EXPORTER_OTLP_HTTP_ENDPOINT and OTEL_EXPORTER_OTLP_GRPC_ENDPOINT are not set');
} else {
  if (OTEL_EXPORTER_OTLP_GRPC_ENDPOINT) {
    logger.info(`OTEL_EXPORTER_OTLP_GRPC_ENDPOINT: ${OTEL_EXPORTER_OTLP_GRPC_ENDPOINT}`);
  } else {
    logger.info(`OTEL_EXPORTER_OTLP_HTTP_ENDPOINT: ${OTEL_EXPORTER_OTLP_HTTP_ENDPOINT}`);
  }
  const traceExporter = OTEL_EXPORTER_OTLP_GRPC_ENDPOINT
    ? new OTLPTraceExporterGrpc({
        url: OTEL_EXPORTER_OTLP_GRPC_ENDPOINT,
      })
    : new OTLPTraceExporter({
        url: `${OTEL_EXPORTER_OTLP_HTTP_ENDPOINT}/v1/traces`,
      });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _metricExporter = OTEL_EXPORTER_OTLP_GRPC_ENDPOINT
    ? new OTLPMetricExporterGrpc({
        url: OTEL_EXPORTER_OTLP_GRPC_ENDPOINT,
      })
    : new OTLPMetricExporter({
        url: `${OTEL_EXPORTER_OTLP_HTTP_ENDPOINT}/v1/metrics`,
      });

  const provider = new NodeTracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: 'cake-system',
      'deployment.environment': configService.get('APP_ENV'),
    }),
    spanProcessors: [new BatchSpanProcessor(traceExporter)],
  });

  provider.register();

  registerInstrumentations({
    instrumentations: [
      new HttpInstrumentation({
        requestHook: (span, request) => {
          if (request instanceof IncomingMessage) {
            request.headers['x-span-id'] = span.spanContext().spanId;
            request.headers['x-trace-id'] = span.spanContext().traceId;
          }
        },
        responseHook: (span, response) => {
          if (response instanceof ServerResponse) {
            response.setHeader('x-span-id', span.spanContext().spanId);
            response.setHeader('x-trace-id', span.spanContext().traceId);
          }
        },
        ignoreIncomingRequestHook: (request) => {
          return request.method?.toUpperCase() === 'OPTIONS';
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        applyCustomAttributesOnSpan: (span, request, response) => {
          if (request instanceof ClientRequest) {
            span.updateName(`HTTP ${request.method.toUpperCase()} ${request.protocol}://${request.host}${request.path}`);
          }
          if (request instanceof IncomingMessage) {
            if ((request as unknown as FastifyRequest).user?.sub) {
              span.setAttribute('user.id', (request as unknown as FastifyRequest).user?.sub as string);
              span.setAttribute('user.fullname', (request as unknown as FastifyRequest).user?.fullname as string);
            }
          }
        },
      }),
      new IORedisInstrumentation(),
      new PgInstrumentation({
        requireParentSpan: true,
      }),
      new NestInstrumentation(),
      new RuntimeNodeInstrumentation(),
      new BullMQInstrumentation({
        useProducerSpanAsConsumerParent: true,
      }),
    ],
  });
}
