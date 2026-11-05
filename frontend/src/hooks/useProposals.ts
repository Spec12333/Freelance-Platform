// useGetProposals(id), useCreateProposal, useAcceptProposal, useGetMyProposals(filters).

import {
  acceptProposal,
  createProposal,
  getMyProposals,
  getProposals,
} from "@/api/proposals.api";
import { useAuthStore } from "@/store/auth";
import type { CreateProposalBody, MyProposalsFilters } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type CreateProposalParams = {
  id: number;
  body: CreateProposalBody;
};

// Fetch an order's proposals and mark them as viewed.
export const useGetProposals = (id: number) => {
  return useQuery({
    queryKey: ["proposals", "detail", id],
    queryFn: () => getProposals(id),
  });
};

// Submit a proposal and refresh related data.
export const useCreateProposal = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProposalParams) =>
      createProposal(data.id, data.body),

    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["proposals"] }),
        client.invalidateQueries({ queryKey: ["orders"] }),
        client.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
};

// Accept a proposal and assign the freelancer.
export const useAcceptProposal = (id: number) => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: () => acceptProposal(id),

    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["proposals"] }),
        client.invalidateQueries({ queryKey: ["orders"] }),
        client.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
};

// Fetch the current freelancer's proposals.
export const useGetMyProposals = (filters: MyProposalsFilters = {}) => {
  const userId = useAuthStore((state) => state.user?.id);
  const role = useAuthStore((state) => state.user?.role);
  const token = useAuthStore((state) => state.token);

  return useQuery({
    queryKey: ["proposals", "my", userId, filters],
    queryFn: () => getMyProposals(filters),
    // Fetch only when a freelancer is signed in.
    enabled: Boolean(token && userId && role === "FREELANCER"),
  });
};
