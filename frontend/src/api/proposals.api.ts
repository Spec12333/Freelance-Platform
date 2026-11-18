// getProposals(orderId), createProposal(orderId, data), updateProposal(id, body), deleteProposal(id), acceptProposal(id), getMyProposals(filters).

import type { Proposal, ProposalWithOrder } from "@/types/models";
import api from "./client";
import type {
  AcceptProposalResponse,
  CreateProposalBody,
  MyProposalsFilters,
  Paginated,
  UpdateProposalBody,
} from "@/types/api";

export const getProposals = async (orderId: number) => {
  const result = await api.get<Proposal[]>(`/orders/${orderId}/proposals`);
  return result.data;
};

export const createProposal = async (
  orderId: number,
  data: CreateProposalBody,
) => {
  const result = await api.post<Proposal>(`/orders/${orderId}/proposals`, data);
  return result.data;
};

export const acceptProposal = async (proposalId: number) => {
  const result = await api.post<AcceptProposalResponse>(
    `/proposals/${proposalId}/accept`,
  );
  return result.data;
};

export const updateProposal = async (proposalId: number, body: UpdateProposalBody) => {
  const result = await api.patch<Proposal>(`/proposals/${proposalId}`, body);
  return result.data;
};

export const getMyProposals = async (filters: MyProposalsFilters) => {
  const result = await api.get<Paginated<ProposalWithOrder>>("/proposals/my", {
    params: filters,
  });
  return result.data;
};

export const deleteProposal = async (proposalId: number): Promise<void> => {
  await api.delete(`/proposals/${proposalId}`);
};
