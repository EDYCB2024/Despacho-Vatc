"use client";

import React, { createContext, useContext, useState } from "react";

interface SidebarContextType {
  isOpen: boolean;
  toggle: () => void;
  setIsOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  isOpen: true,
  toggle: () => {},
  setIsOpen: () => {},
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true);
  const toggle = () => setIsOpen((prev) => !prev);

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, setIsOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
