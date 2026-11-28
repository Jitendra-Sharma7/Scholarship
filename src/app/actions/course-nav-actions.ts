"use server";

import { getCourseNavGroupsServer } from "@/lib/data/course-nav";

export async function fetchCourseNavGroups() {
  return getCourseNavGroupsServer();
}