import React from "react";
import Skeleton from "./Skeleton";

export default function SkeletonAvatar({ size = 64 }) {
  return <Skeleton height={size} width={size} radius={999} />;
}
