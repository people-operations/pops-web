export function getAuthTokenOrThrow() {
  const token = localStorage.getItem("idToken");
  if (!token) {
    throw new Error("Token não encontrado no localStorage");
  }
  return token;
}

/**
 * Decodifica um JWT token e retorna o payload
 * @param {string} token - O token JWT
 * @returns {object|null} - O payload decodificado ou null se inválido
 */
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Token JWT inválido');
    }
    
    // Decodifica o payload (segunda parte do token)
    const payload = parts[1];
    // Substitui caracteres base64url para base64 padrão
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    // Adiciona padding se necessário
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    // Decodifica
    const decoded = JSON.parse(atob(padded));
    return decoded;
  } catch (error) {
    console.error('Erro ao decodificar token JWT:', error);
    return null;
  }
}

/**
 * Obtém o access_level do token JWT armazenado
 * @returns {number|null} - O access_level como número ou null se não encontrado
 */
export function getAccessLevel() {
  try {
    const token = localStorage.getItem("idToken");
    if (!token) {
      return null;
    }
    
    const payload = decodeJWT(token);
    const accessLevel = payload?.access_level;
    
    // Converte para número se existir
    if (accessLevel !== undefined && accessLevel !== null) {
      const numLevel = Number(accessLevel);
      return isNaN(numLevel) ? null : numLevel;
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao obter access_level:', error);
    return null;
  }
}

/**
 * Obtém todas as informações do payload do token JWT
 * @returns {object|null} - O payload completo ou null se não encontrado
 */
export function getTokenPayload() {
  try {
    const token = localStorage.getItem("idToken");
    if (!token) {
      return null;
    }
    
    return decodeJWT(token);
  } catch (error) {
    console.error('Erro ao obter payload do token:', error);
    return null;
  }
}

export const apiService = {
  async login(email, password) {
    const response = await fetch(
      "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyD_bBtonx1kEtBCWCCbKM09k2fOK3jgJUs",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      }
    );
    const data = await response.json();
    return data;
  },

  async insertProject(project) {
    try {
      const token = getAuthTokenOrThrow();
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(project),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Erro ao inserir projeto:", error.message);
      return null;
    }
  },

  async getAllProjects() {
    try {
      console.log("🔐 Obtendo token de autenticação...");
      const token = getAuthTokenOrThrow();
      console.log("✅ Token obtido:", token ? "Token presente" : "Token ausente");
      
      console.log("📡 Fazendo requisição para: /api/projects");
      console.log("⏳ Aguardando resposta...");
      
      const startTime = Date.now();
      
      const response = await fetch("/api/projects", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      const endTime = Date.now();
      console.log(`⏱️ Resposta recebida em ${endTime - startTime}ms`);

      console.log("📥 Status da resposta:", response.status, response.statusText);
      console.log("📥 Content-Type:", response.headers.get("Content-Type"));
      console.log("📥 Content-Length:", response.headers.get("Content-Length"));

      if (response.status === 204) {
        console.log("⚠️ Resposta 204 No Content - retornando array vazio");
        return [];
      }

      if (!response.ok) {
        console.log("❌ Resposta não OK, tentando ler texto do erro...");
        const errorText = await response.text();
        console.error("❌ Erro HTTP:", response.status, errorText);
        throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
      }
      
      console.log("📦 Verificando se há conteúdo para parsear...");
      const contentType = response.headers.get("Content-Type");
      console.log("📦 Content-Type:", contentType);
      
      if (!contentType || !contentType.includes("application/json")) {
        console.warn("⚠️ Content-Type não é JSON:", contentType);
        const text = await response.text();
        console.log("📄 Conteúdo como texto:", text);
        return [];
      }
      
      console.log("📦 Parseando JSON da resposta...");
      const data = await response.json();
      console.log("📦 Dados parseados:", data);
      console.log("📊 Tipo dos dados:", typeof data);
      console.log("📊 É array?", Array.isArray(data));
      
      if (data) {
        console.log("📊 Estrutura dos dados:", JSON.stringify(data, null, 2));
      }
      
      // Garante que sempre retorna um array
      const result = Array.isArray(data) ? data : [];
      console.log("✅ Retornando:", result.length, "projetos");
      return result;
    } catch (error) {
      console.error("❌ Erro ao buscar projetos:", error);
      console.error("❌ Mensagem:", error.message);
      console.error("❌ Nome:", error.name);
      if (error.stack) {
        console.error("❌ Stack trace:", error.stack);
      }
      // Mostra notificação para o usuário
      if (window.showNotification) {
        window.showNotification("error", "Erro ao buscar projetos: " + error.message);
      }
      return [];
    }
  },

  async getProjectById(id) {
    try {
      const token = getAuthTokenOrThrow();
      const response = await fetch(`/api/projects/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Erro ao buscar projeto com ID ${id}:`, error.message);
      return null;
    }
  },

  async deleteProjectById(id) {
    try {
      const token = getAuthTokenOrThrow();
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
      }
      return true;
    } catch (error) {
      console.error(`Erro ao deletar projeto com ID ${id}:`, error.message);
      return false;
    }
  },

  async disableProject(id) {
    try {
      const token = getAuthTokenOrThrow();
      const response = await fetch(`/api/projects/disable/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Erro ao desativar projeto com ID ${id}:`, error.message);
      throw error;
    }
  },

  async enableProject(id) {
    try {
      const token = getAuthTokenOrThrow();
      const response = await fetch(`/api/projects/enable/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Erro ao ativar projeto com ID ${id}:`, error.message);
      throw error;
    }
  },

  async updateProject(id, project) {
    try {
      const token = getAuthTokenOrThrow();
      const response = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(project),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Erro ao atualizar projeto com ID ${id}:`, error.message);
      return null;
    }
  },

  async getProjectTypes() {
    try {
      const token = getAuthTokenOrThrow();
      const response = await fetch("/api/project-types", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 204) {
          return [];
        }
        const errorText = await response.text();
        throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Erro ao buscar project types:", error.message);
      return [];
    }
  },

  async getProjectStatuses() {
    try {
      const token = getAuthTokenOrThrow();
      const response = await fetch("/api/project-status", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 204) {
          return [];
        }
        const errorText = await response.text();
        throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("Erro ao buscar project statuses:", error.message);
      return [];
    }
  },

  async getSkills() {
    try {
      const token = getAuthTokenOrThrow();
      const response = await fetch("/api/skills", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Erro ao buscar skills:", error.message);
      return null;
    }
  },

  async getAllSquads() {
    try {
      const token = getAuthTokenOrThrow();
      const response = await fetch("/api-squad/teams?page=0&size=100", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      console.log("Resposta completa da API de squads:", data);
      // Se for uma página paginada, retorna o content, senão retorna o array direto
      if (data && data.content && Array.isArray(data.content)) {
        return data.content;
      } else if (Array.isArray(data)) {
        return data;
      } else {
        console.warn("Formato de resposta inesperado:", data);
        return [];
      }
    } catch (error) {
      console.error("Erro ao buscar squads:", error.message);
      return [];
    }
  },

  async insertSquad(squad) {
    try {
      const token = getAuthTokenOrThrow();
      const response = await fetch("/api-squad/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(squad),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Erro ao inserir squad:", error.message);
      return null;
    }
  },

  async updateSquad(squadId, squad) {
    try {
      const token = getAuthTokenOrThrow();
      const response = await fetch(
        `/api-squad/teams/${squadId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(squad),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Erro ao atualizar squad:", error.message);
      throw error;
    }
  },

  async deleteSquadById(squadId) {
    try {
      const token = getAuthTokenOrThrow();
      const response = await fetch(
        `/api-squad/teams/${squadId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

      return true;
    } catch (error) {
      console.error("Erro ao deletar squad:", error);
      return false;
    }
  },

  async getSquadById(squadId) {
    try {
      const token = getAuthTokenOrThrow();
      const response = await fetch(
        `/api-squad/teams/${squadId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

      const squad = await response.json();
      return squad;
    } catch (error) {
      console.error("Erro ao carregar squad:", error);
      return null;
    }
  },

  async getSquadAllocations(squadId) {
    try {
      const token = getAuthTokenOrThrow();
      const response = await fetch(
        `/api-squad/teams/${squadId}/allocations`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

      const allocations = await response.json();
      return allocations;
    } catch (error) {
      console.error("Erro ao carregar alocações do squad:", error);
      return null;
    }
  },

  /**
   * Busca todas as alocações de um funcionário específico
   * @param {number} personId - ID do funcionário
   * @returns {Promise<Array>} - Lista de alocações
   */
  async getAllocationsByEmployeeId(personId) {
    try {
      const token = getAuthTokenOrThrow();
      const response = await fetch(
        `/api-squad/teams/allocations/person/${personId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return []; // Retornar array vazio se não houver alocações
        }
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const allocations = await response.json();
      return Array.isArray(allocations) ? allocations : [];
    } catch (error) {
      console.error("Erro ao buscar alocações do funcionário:", error);
      return []; // Retornar array vazio em caso de erro
    }
  },

  /**
   * Busca todas as alocações (apenas para managers)
   * @returns {Promise<Array>} - Lista de todas as alocações
   */
  async getAllocations() {
    try {
      // Buscar todas as squads primeiro
      const squads = await this.getAllSquads();
      const allAllocations = [];
      
      // Buscar alocações de cada squad
      for (const squad of squads) {
        try {
          const allocations = await this.getSquadAllocations(squad.id);
          if (allocations && Array.isArray(allocations)) {
            allAllocations.push(...allocations);
          }
        } catch (error) {
          console.warn(`Erro ao buscar alocações do squad ${squad.id}:`, error);
        }
      }
      
      return allAllocations;
    } catch (error) {
      console.error("Erro ao buscar todas as alocações:", error);
      return [];
    }
  },

  async getSquadDetails(squadId) {
    try {
      const token = getAuthTokenOrThrow();
      const response = await fetch(
        `/api-squad/teams/${squadId}/details`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

      const details = await response.json();
      return details;
    } catch (error) {
      console.error("Erro ao carregar detalhes do squad:", error);
      return null;
    }
  },

  async insertSquadAllocations(squadId, allocations) {
    try {
      const token = getAuthTokenOrThrow();
      const response = await fetch(
        `/api-squad/teams/${squadId}/allocations`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(allocations),
        }
      );

      if (!response.ok) {
        // Tenta ler a mensagem de erro do servidor
        let errorMessage = `Erro HTTP: ${response.status}`;
        try {
          const errorBody = await response.text();
          if (errorBody) {
            try {
              const errorJson = JSON.parse(errorBody);
              errorMessage = errorJson.message || errorJson.error || errorMessage;
            } catch {
              errorMessage = errorBody || errorMessage;
            }
          }
        } catch (e) {
          console.warn("Não foi possível ler mensagem de erro do servidor:", e);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Erro ao inserir alocações do squad:", error);
      throw error; // Re-lança o erro para que o chamador possa tratá-lo
    }
  },

  async getCollaboratorById(employeeId) {
    try {
      const token = getAuthTokenOrThrow();
      const response = await fetch(
        `/api-employee/employees/${employeeId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

      const employee = await response.json();
      return employee;
    } catch (error) {
      console.error("Erro ao carregar colaborador:", error);
      return null;
    }
  },

  async getSquadsByCollaboratorId(employeeId) {
    try {
      const token = getAuthTokenOrThrow();
      const response = await fetch(
        `/api-squad/teams/allocations/person/${employeeId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

      const squads = await response.json();
      return squads;
    } catch (error) {
      console.error("Erro ao carregar squads do colaborador:", error);
      return null;
    }
  },

  async getCollaborators(filters = {}) {
    try {
      const token = getAuthTokenOrThrow();
      const params = new URLSearchParams();
      if (filters.employeeName)
        params.append("employeeName", filters.employeeName);
      if (filters.departament)
        params.append("departmentName", filters.departament);
      if (filters.jobTitle) params.append("jobTitle", filters.jobTitle);
      if (filters.project) params.append("project", filters.project);
      if (filters.squad) params.append("squad", filters.squad);
      const response = await fetch(
        `/api-employee/employees?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Erro ao carregar colaboradores:", error);
      return null;
    }
  },

  async getOdooSkills() {
    try {
      const token = getAuthTokenOrThrow();
      const response = await fetch(`/api-employee/skills`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Erro ao carregar skills do Odoo:", error);
      return null;
    }
  },

  async getProjectTeamMembers(projectId) {
    try {
      const token = getAuthTokenOrThrow();
      const response = await fetch(
        `/api/projects/${projectId}/team-members`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Erro ao carregar membros dos teams:", error);
      return null;
    }
  },

  async getProjectTeamDetails(projectId) {
    try {
      const token = getAuthTokenOrThrow();
      const response = await fetch(
        `/api/projects/${projectId}/team-details`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error("Erro ao carregar detalhes dos teams:", error);
      return null;
    }
  },
};
