// CloudFront URL converter for optimized media delivery
const CLOUDFRONT_DOMAIN = process.env.REACT_APP_CLOUDFRONT_DOMAIN || 'd9xyz123abc.cloudfront.net'; // Replace with your actual CloudFront domain
const S3_BUCKET_URL = 'https://uploadhere-storage-pc.s3.amazonaws.com';

export const getCloudFrontUrl = (url) => {
  if (!url) return url;
  
  // Convert S3 URL to CloudFront URL
  if (url.includes('uploadhere-storage-pc.s3.amazonaws.com')) {
    return url.replace(S3_BUCKET_URL, `https://${CLOUDFRONT_DOMAIN}`);
  }
  
  // Also handle s3.region.amazonaws.com format
  if (url.includes('.s3.') && url.includes('amazonaws.com')) {
    const path = url.split('.amazonaws.com')[1];
    return `https://${CLOUDFRONT_DOMAIN}${path}`;
  }
  
  return url;
};
