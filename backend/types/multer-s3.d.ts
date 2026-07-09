declare module 'multer-s3' {
  import { S3 } from 'aws-sdk';
  import multer from 'multer';
  import { Request } from 'express';

  interface Options {
    s3: S3;
    bucket: string;
    acl?: string;
    contentType?: (req: Request, file: Express.Multer.File, cb: (error: any, mime?: string) => void) => void;
    contentDisposition?: (req: Request, file: Express.Multer.File, cb: (error: any, disposition?: string) => void) => void;
    metadata?: (req: Request, file: Express.Multer.File, cb: (error: any, metadata?: any) => void) => void;
    key?: (req: Request, file: Express.Multer.File, cb: (error: any, key?: string) => void) => void;
    serverSideEncryption?: string;
  }

  function s3(options: Options): multer.StorageEngine;

  export = s3;
}

