"use client";

import Link from "next/link";
import { BellIcon, SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";

export function TopNav() {
  return (
    <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
      <div className="flex w-full items-center gap-4 px-4 py-3">
        <form className="relative hidden flex-1 items-center md:flex">
          <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search topics, brands, engines..."
            className="pl-9"
          />
        </form>
        <Button variant="outline" size="sm" className="shrink-0">
          New Topic
        </Button>
        <Button variant="secondary" size="sm" className="shrink-0">
          Deploy Scraper
        </Button>
        <ThemeToggle />
        <Button size="icon" variant="ghost" className="rounded-full">
          <BellIcon className="h-5 w-5" />
          <span className="sr-only">View alerts</span>
        </Button>
        <Link href="/settings" className="flex items-center gap-2">
          <Avatar className="h-9 w-9 border">
            <AvatarFallback>BL</AvatarFallback>
          </Avatar>
          <div className="hidden text-left text-sm leading-tight md:block">
            <p className="font-medium">Brandon Hendricks</p>
            <p className="text-xs text-muted-foreground">Founder</p>
          </div>
        </Link>
      </div>
    </header>
  );
}



