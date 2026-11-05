// useGetCategories().

import { getCategories } from "@/api/categories.api";
import { useQuery } from "@tanstack/react-query";

// Fetch categories for forms and filters.
export const useGetCategories = () => {
    return useQuery({
        queryKey : ["categories"],
        queryFn : () => getCategories()
    })
}
