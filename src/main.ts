import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

(BigInt.prototype as any).toJSON = function () {
  return Number(this); // Converts BigInt to a standard JSON number
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT || 3000;
  
  // Call app.listen ONLY ONCE here:
  await app.listen(port);
  console.log(`Application is running on port ${port}`);
}
void bootstrap();
