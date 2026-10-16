"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { Problems } from "@/components/sapa/problems";
import { Loading } from "@/components/sapa/ui";

function View() {
  const { driver } = useParams<{ driver?: string }>();
  return <Problems driver={driver} />;
}

export default function Layout() {
  return (
    <Suspense fallback={<Loading />}>
      <View />
    </Suspense>
  );
}
