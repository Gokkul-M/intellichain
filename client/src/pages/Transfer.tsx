
import React from "react";
import { Navbar } from "@/components/Navbar";
import { RealTransferGuide } from "@/components/RealTransferGuide";
import { TokenSwap } from "@/components/TokenSwap";
import { BlockDAGHeader } from "@/components/BlockDAGHeader";

const Transfer = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <BlockDAGHeader />
        <div className="mt-6">
          <RealTransferGuide />
        </div>
        <div className="mt-6 flex justify-center">
          <TokenSwap />
        </div>
      </div>
    </div>
  );
};

export default Transfer;
