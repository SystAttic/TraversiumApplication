import React from "react";
import Skeleton from "./Skeleton";

export default function SkeletonRect({ height = 140, radius = 12 }) {
  return <Skeleton height={height} radius={radius} />;
}
