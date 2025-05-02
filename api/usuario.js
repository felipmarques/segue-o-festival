app.get("/api/usuario", async (req, res) => {
    const { email } = req.query;

    if (!email) return res.status(400).json({ message: "Email é obrigatório" });

    try {
        const resultado = await pool.query(
            "SELECT nome, cpf, data_nascimento, sexo, endereco, cep, numero, complemento, municipio, uf FROM usuarios WHERE email = $1",
            [email]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({ message: "Usuário não encontrado" });
        }

        res.json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro interno do servidor" });
    }
});
