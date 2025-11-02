import React from "react";
import Skeleton from "./Skeleton";

export default function SkeletonText({ lines = 2, gap = 8, width = "100%" }) {
  return (
    <React.Fragment>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={12}
          width={i === lines - 1 ? (typeof width === "number" ? width * 0.6 : "60%") : width}
          style={{ marginBottom: i === lines - 1 ? 0 : gap }}
        />
      ))}
    </React.Fragment>
  );
}
