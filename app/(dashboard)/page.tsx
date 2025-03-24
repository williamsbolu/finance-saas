import { Suspense } from "react";
import { DataCharts } from "@/components/charts/data-charts";
import { DataGrid } from "@/components/charts/data-grid";
import { DataCardLoading } from "@/components/charts/data-card";
import { ChartLoading } from "@/components/charts/chart";
import { SpendingPieLoading } from "@/components/charts/spending-pie";

export default function DashboardPage() {
  return (
    <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
      <Suspense fallback={<div>Loading</div>}>
        <DataGrid />
        <DataCharts />
      </Suspense>
    </div>
  );
}

{
  /* <>
  <div className="grid gap-8 pb-2 mb-8 grid-cols-1 lg:grid-cols-3">
    <DataCardLoading />
    <DataCardLoading />
    <DataCardLoading />
  </div>
  <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
    <div className="col-span-1 lg:col-span-3 xl:col-span-4">
      <ChartLoading />
    </div>
    <div className="col-span-1 lg:col-span-3 xl:col-span-2">
      <SpendingPieLoading />
    </div>
  </div>
</>; */
}
