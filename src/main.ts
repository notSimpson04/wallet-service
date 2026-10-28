import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

(BigInt.prototype as any).toJSON = function () {
  return Number(this); // Converts BigInt to a standard JSON number
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT || 3000;
  
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on port ${port}`);
}
void bootstrap();
