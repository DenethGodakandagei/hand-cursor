declare module '@tensorflow-models/handpose' {
  import * as tf from '@tensorflow/tfjs-core';

  export interface Prediction {
    handInViewConfidence: number;
    boundingBox: {
      topLeft: [number, number];
      bottomRight: [number, number];
    };
    landmarks: Array<[number, number, number]>;
    annotations: { [key: string]: Array<[number, number, number]> };
  }

  export class HandPose {
    estimateHands(
      input: tf.Tensor3D | HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
      flipHorizontal?: boolean
    ): Promise<Prediction[]>;
  }

  export function load(): Promise<HandPose>;
}
