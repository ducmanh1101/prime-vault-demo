import React from "react";
import HeaderLayout from "./Header";

interface LayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="h-screen flex flex-col">
      <HeaderLayout />
      <div className="flex flex-col flex-1 w-full bg-base-300">
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
};

export default AppLayout;
