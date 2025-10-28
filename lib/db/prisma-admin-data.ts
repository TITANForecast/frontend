/**
 * Prisma database service for admin operations
 */

import { PrismaClient } from "@/generated/prisma";
import {
  DealerExtended,
  DealerApiConfig,
  UserExtended,
  SyncStatus,
  AdminStats,
} from "@/lib/types/admin";
import { UserRole } from "@/lib/types/auth";

// Initialize Prisma Client
const prisma = new PrismaClient();

// Helper to convert Prisma Dealer to DealerExtended
const convertToExtendedDealer = (dealer: any): DealerExtended => {
  return {
    id: dealer.id,
    name: dealer.name,
    address: dealer.address || undefined,
    city: dealer.city || undefined,
    state: dealer.state || undefined,
    zip: dealer.zip || undefined,
    contactEmail: dealer.contactEmail || undefined,
    contactPhone: dealer.contactPhone || undefined,
    isActive: dealer.isActive,
    createdAt: dealer.createdAt,
    updatedAt: dealer.updatedAt,
    apiConfig: dealer.apiConfig
      ? {
          id: dealer.apiConfig.id,
          dealerId: dealer.apiConfig.dealerId,
          dataSource: dealer.apiConfig.dataSource,
          rooftopId: dealer.apiConfig.rooftopId,
          programId: dealer.apiConfig.programId,
          fileTypeCodes: dealer.apiConfig.fileTypeCodes,
          compareDateDefault: dealer.apiConfig.compareDateDefault,
          lastSuccess: dealer.apiConfig.lastSuccess,
          lastError: dealer.apiConfig.lastError,
          isActive: dealer.apiConfig.isActive,
          createdAt: dealer.apiConfig.createdAt,
          updatedAt: dealer.apiConfig.updatedAt,
        }
      : undefined,
  };
};

// Helper to convert Prisma User to UserExtended
const convertToExtendedUser = (user: any): UserExtended => {
  const dealers =
    user.dealers?.map((ud: any) => convertToExtendedDealer(ud.dealer)) || [];

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as UserRole,
    defaultDealerId: user.defaultDealerId,
    isActive: user.isActive,
    dealers,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

// Dealer operations
export const prismaDb = {
  dealers: {
    findAll: async (): Promise<DealerExtended[]> => {
      const dealers = await prisma.dealer.findMany({
        include: {
          apiConfig: true,
        },
        orderBy: {
          name: "asc",
        },
      });
      return dealers.map(convertToExtendedDealer);
    },

    findById: async (id: string): Promise<DealerExtended | null> => {
      const dealer = await prisma.dealer.findUnique({
        where: { id },
        include: {
          apiConfig: true,
        },
      });
      return dealer ? convertToExtendedDealer(dealer) : null;
    },

    create: async (
      data: Omit<DealerExtended, "id" | "createdAt" | "updatedAt">
    ): Promise<DealerExtended> => {
      const dealer = await prisma.dealer.create({
        data: {
          name: data.name,
          address: data.address,
          city: data.city,
          state: data.state,
          zip: data.zip,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          isActive: data.isActive,
        },
        include: {
          apiConfig: true,
        },
      });
      return convertToExtendedDealer(dealer);
    },

    update: async (
      id: string,
      data: Partial<DealerExtended>
    ): Promise<DealerExtended | null> => {
      try {
        const dealer = await prisma.dealer.update({
          where: { id },
          data: {
            name: data.name,
            address: data.address,
            city: data.city,
            state: data.state,
            zip: data.zip,
            contactEmail: data.contactEmail,
            contactPhone: data.contactPhone,
            isActive: data.isActive,
          },
          include: {
            apiConfig: true,
          },
        });
        return convertToExtendedDealer(dealer);
      } catch (error) {
        return null;
      }
    },

    delete: async (id: string): Promise<boolean> => {
      try {
        await prisma.dealer.delete({
          where: { id },
        });
        return true;
      } catch (error) {
        return false;
      }
    },
  },

  apiConfigs: {
    findByDealerId: async (
      dealerId: string
    ): Promise<DealerApiConfig | null> => {
      const config = await prisma.dealerApiConfig.findUnique({
        where: { dealerId },
      });
      return config as DealerApiConfig | null;
    },

    create: async (
      data: Omit<DealerApiConfig, "id" | "createdAt" | "updatedAt">
    ): Promise<DealerApiConfig> => {
      try {
        console.log("Creating API config for dealer:", data.dealerId);
        const config = await prisma.dealerApiConfig.create({
          data: {
            dealerId: data.dealerId,
            dataSource: data.dataSource,
            rooftopId: data.rooftopId,
            programId: data.programId,
            fileTypeCodes: data.fileTypeCodes,
            compareDateDefault: data.compareDateDefault,
            lastSuccess: data.lastSuccess,
            lastError: data.lastError,
            isActive: data.isActive,
          },
        });
        console.log("API config created successfully:", config.id);
        return config as DealerApiConfig;
      } catch (error: any) {
        console.error("Error in prismaDb.apiConfigs.create:", {
          dealerId: data.dealerId,
          errorCode: error.code,
          errorMessage: error.message,
          errorMeta: error.meta,
        });
        throw error;
      }
    },

    update: async (
      id: string,
      data: Partial<DealerApiConfig>
    ): Promise<DealerApiConfig | null> => {
      try {
        console.log("Updating API config:", id);
        const config = await prisma.dealerApiConfig.update({
          where: { id },
          data: {
            dataSource: data.dataSource,
            rooftopId: data.rooftopId,
            programId: data.programId,
            fileTypeCodes: data.fileTypeCodes,
            compareDateDefault: data.compareDateDefault,
            lastSuccess: data.lastSuccess,
            lastError: data.lastError,
            isActive: data.isActive,
          },
        });
        console.log("API config updated successfully:", config.id);
        return config as DealerApiConfig;
      } catch (error: any) {
        console.error("Error in prismaDb.apiConfigs.update:", {
          configId: id,
          errorCode: error.code,
          errorMessage: error.message,
          errorMeta: error.meta,
        });
        return null;
      }
    },

    delete: async (id: string): Promise<boolean> => {
      try {
        await prisma.dealerApiConfig.delete({
          where: { id },
        });
        return true;
      } catch (error) {
        return false;
      }
    },
  },

  users: {
    findAll: async (): Promise<UserExtended[]> => {
      const users = await prisma.user.findMany({
        include: {
          dealers: {
            include: {
              dealer: {
                include: {
                  apiConfig: true,
                },
              },
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      });
      return users.map(convertToExtendedUser);
    },

    findById: async (id: string): Promise<UserExtended | null> => {
      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          dealers: {
            include: {
              dealer: {
                include: {
                  apiConfig: true,
                },
              },
            },
          },
        },
      });
      return user ? convertToExtendedUser(user) : null;
    },

    create: async (
      data: Omit<UserExtended, "id" | "createdAt" | "updatedAt" | "dealers">
    ): Promise<UserExtended> => {
      const user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          role: data.role,
          defaultDealerId: data.defaultDealerId,
          isActive: data.isActive,
        },
        include: {
          dealers: {
            include: {
              dealer: {
                include: {
                  apiConfig: true,
                },
              },
            },
          },
        },
      });
      return convertToExtendedUser(user);
    },

    update: async (
      id: string,
      data: Partial<UserExtended>
    ): Promise<UserExtended | null> => {
      try {
        const user = await prisma.user.update({
          where: { id },
          data: {
            email: data.email,
            name: data.name,
            role: data.role,
            defaultDealerId: data.defaultDealerId,
            isActive: data.isActive,
          },
          include: {
            dealers: {
              include: {
                dealer: {
                  include: {
                    apiConfig: true,
                  },
                },
              },
            },
          },
        });
        return convertToExtendedUser(user);
      } catch (error) {
        return null;
      }
    },

    delete: async (id: string): Promise<boolean> => {
      try {
        await prisma.user.delete({
          where: { id },
        });
        return true;
      } catch (error) {
        return false;
      }
    },
  },

  userDealers: {
    addUserDealer: async (userId: string, dealerId: string): Promise<void> => {
      try {
        await prisma.userDealer.create({
          data: {
            userId,
            dealerId,
          },
        });
      } catch (error) {
        // Ignore duplicate key errors
        console.error("Error adding user dealer:", error);
      }
    },

    removeUserDealer: async (
      userId: string,
      dealerId: string
    ): Promise<void> => {
      try {
        await prisma.userDealer.delete({
          where: {
            userId_dealerId: {
              userId,
              dealerId,
            },
          },
        });
      } catch (error) {
        console.error("Error removing user dealer:", error);
      }
    },

    setUserDealers: async (
      userId: string,
      dealerIds: string[]
    ): Promise<void> => {
      // Remove all existing associations
      await prisma.userDealer.deleteMany({
        where: { userId },
      });

      // Add new associations
      if (dealerIds.length > 0) {
        await prisma.userDealer.createMany({
          data: dealerIds.map((dealerId) => ({
            userId,
            dealerId,
          })),
        });
      }
    },

    getUserDealers: async (userId: string): Promise<string[]> => {
      const userDealers = await prisma.userDealer.findMany({
        where: { userId },
        select: { dealerId: true },
      });
      return userDealers.map((ud) => ud.dealerId);
    },
  },

  stats: {
    getAdminStats: async (): Promise<AdminStats> => {
      const [
        totalDealers,
        activeDealersCount,
        totalUsers,
        activeUsersCount,
        apiConfigs,
      ] = await Promise.all([
        prisma.dealer.count(),
        prisma.dealer.count({ where: { isActive: true } }),
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.dealerApiConfig.findMany({
          select: {
            lastSuccess: true,
            lastError: true,
          },
        }),
      ]);

      const lastSyncs = apiConfigs
        .map((c) => c.lastSuccess)
        .filter((d) => d != null) as Date[];

      const syncErrors = apiConfigs.filter((c) => c.lastError != null).length;

      return {
        totalDealers,
        activeDealers: activeDealersCount,
        totalUsers,
        activeUsers: activeUsersCount,
        lastSyncTimestamp:
          lastSyncs.length > 0
            ? new Date(Math.max(...lastSyncs.map((d) => d.getTime())))
            : null,
        syncErrors,
      };
    },

    getSyncStatus: async (): Promise<SyncStatus[]> => {
      const dealers = await prisma.dealer.findMany({
        include: {
          apiConfig: true,
        },
        orderBy: {
          name: "asc",
        },
      });

      return dealers.map((dealer) => {
        const config = dealer.apiConfig;
        let status: SyncStatus["status"] = "never_run";

        if (config) {
          if (config.lastError) {
            status = "error";
          } else if (config.lastSuccess) {
            status = "success";
          } else {
            status = "pending";
          }
        }

        return {
          dealerId: dealer.id,
          dealerName: dealer.name,
          lastSync: config?.lastSuccess || config?.updatedAt || null,
          lastSuccess: config?.lastSuccess || null,
          lastError: config?.lastError || null,
          status,
          isActive: dealer.isActive && (config?.isActive ?? false),
        };
      });
    },
  },
};

// Export Prisma Client for direct access when needed
export { prisma };
