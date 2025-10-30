/* começando uma API service pra colocar todos os fetchs */

function getAuthTokenOrThrow() {
  const token = localStorage.getItem("idToken");
  if (!token) {
    throw new Error("Token não encontrado no localStorage");
  }
  return token;
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
      const response = await fetch("http://localhost:8082/api/projects", {
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
    console.log("Fetching all projects from API...");
    try {
      const token = getAuthTokenOrThrow();
      const response = await fetch("http://localhost:8082/api/projects", {
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
      console.error("Erro ao buscar projetos:", error.message);
      return null;
    }
  },

  async getProjectById(id) {
    try {
      const token = getAuthTokenOrThrow();
      const response = await fetch(`http://localhost:8082/api/projects/${id}`, {
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
      const response = await fetch(`http://localhost:8082/api/projects/${id}`, {
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

  async updateProject(id, project) {
    try {
      const token = getAuthTokenOrThrow();
      const response = await fetch(`http://localhost:8082/api/projects/${id}`, {
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
      const response = await fetch("http://localhost:8082/api/project-types", {
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
      console.error("Erro ao buscar project types:", error.message);
      return null;
    }
  },

  async getProjectStatuses() {
    console.log("Getting project statuses...");
    try {
      console.log("Getting project statuses...");
      const token = getAuthTokenOrThrow();
      console.log("Fetching project statuses with token:", token);
      const response = await fetch("http://localhost:8082/api/project-status", {
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
      console.error("Erro ao buscar project statuses:", error.message);
      return null;
    }
  },

  async getSkills() {
    try {
      const token = getAuthTokenOrThrow();
      const response = await fetch("http://localhost:8082/api/skills", {
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
      const response = await fetch("http://localhost:8083/api/teams/1", {
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
      return data.content;
    } catch (error) {
      console.error("Erro ao buscar squads:", error.message);
      return null;
    }
  },
};
