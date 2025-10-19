/* começando uma API service pra colocar todos os fetchs */
export const apiService = {
  async login(email, password) {
    console.log("Fazendo login na API...");
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

  async getProjectTypes() {
    try {
      // Recupera o token do localStorage
      const token = localStorage.getItem("idToken");

      if (!token) {
        throw new Error("Token não encontrado no localStorage");
      }

      // Faz a requisição com o header Authorization
      const response = await fetch("http://localhost:8082/api/project-types", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Tratamento de erro HTTP
        const errorText = await response.text();
        throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
      }

      // Converte a resposta em JSON
      const data = await response.json();
      console.log("Project Types:", data);
      return data;
    } catch (error) {
      console.error("Erro ao buscar project types:", error.message);
      return null;
    }
  },
};
