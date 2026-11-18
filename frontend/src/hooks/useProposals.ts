// useGetProposals(id), useCreateProposal, useUpdateProposal, useDeleteProposal, useAcceptProposal, useGetMyProposals(filters).

import {
  acceptProposal,
  createProposal,
  deleteProposal,
  getMyProposals,
  getProposals,
  updateProposal,
} from "@/api/proposals.api";
import { useAuthStore } from "@/store/auth";
import type { CreateProposalBody, MyProposalsFilters, UpdateProposalBody } from "@/types/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";

type CreateProposalParams = {
  id: number;
  body: CreateProposalBody;
};

type UpdateProposalParams = {
  id: number;
  body: UpdateProposalBody;
};

// Fetch an order's proposals and mark them as viewed.
export const useGetProposals = (
  id: number,
  { enabled = true }: { enabled?: boolean } = {},
) => {
  const client = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  const role = useAuthStore((state) => state.user?.role);
  const token = useAuthStore((state) => state.token);

  return useQuery({
    // Keep private proposal lists separate for each signed-in user.
    queryKey: ["proposals", "detail", id, userId],
    queryFn: async () => {
      const proposals = await getProposals(id);
      // GET marks proposals viewed; refresh the counter in the background.
      void client.invalidateQueries({ queryKey: ["dashboard", userId] });
      return proposals;
    },
    // The parent enables the request only for the order's author.
    enabled: enabled && Boolean(token && userId && role === "CLIENT")
      && Number.isSafeInteger(id) && id > 0,
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

// Edit a proposal and refresh the offer, client list and counters.
export const useUpdateProposal = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProposalParams) => updateProposal(data.id, data.body),

    // Reload statuses if the client processed the proposal during editing.
    onError: async (error) => {
      if (!isAxiosError(error) || error.response?.status !== 409) return;
      await Promise.all([
        client.invalidateQueries({ queryKey: ["proposals"] }),
        client.invalidateQueries({ queryKey: ["orders"] }),
        client.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },

    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ["proposals"] }),
        client.invalidateQueries({ queryKey: ["orders"] }),
        client.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },
  });
};

// Withdraw an offer and refresh the form, proposal counts and dashboards.
export const useDeleteProposal = () => {
  const client = useQueryClient();

  const refreshProposals = async () => {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["proposals"] }),
      client.invalidateQueries({ queryKey: ["orders"] }),
      client.invalidateQueries({ queryKey: ["dashboard"] }),
    ]);
  };

  return useMutation({
    mutationFn: deleteProposal,
    onSuccess: refreshProposals,
    onError: async (error) => {
      if (isAxiosError(error) && [404, 409].includes(error.response?.status ?? 0)) await refreshProposals();
    },
  });
};

// Accept a proposal and assign the freelancer.
export const useAcceptProposal = () => {
  const client = useQueryClient();

  return useMutation({
    mutationFn: acceptProposal,

    onError: async (error) => {
      if (!isAxiosError(error) || ![404, 409].includes(error.response?.status ?? 0)) return;
      await Promise.all([
        client.invalidateQueries({ queryKey: ["proposals"] }),
        client.invalidateQueries({ queryKey: ["orders"] }),
        client.invalidateQueries({ queryKey: ["dashboard"] }),
      ]);
    },

    onSuccess: async ({ order }) => {
      // Hide selection actions immediately using the server's updated order.
      client.setQueryData(["orders", "detail", order.id], order);
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
