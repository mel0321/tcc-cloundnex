import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Image,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather, Ionicons } from '@expo/vector-icons';
import { styles } from './styles'; // Importação do seu arquivo de estilos separado

// ATENÇÃO: Troque o IP conforme o ambiente
// PC Lab: 192.168.100.254 | Android Emulador: 10.0.2.2 | iOS Simulador: localhost
const API_URL = "http://192.168.100.254:3000/api";

export default function App() {
  const [telaAtual, setTelaAtual] = useState('Inicio');
  const [tipoLogado, setTipoLogado] = useState(null);

  // Modais de Controle
  const [modalVisible, setModalVisible] = useState(false);
  const [abaModal, setAbaModal] = useState('entrar');
  const [perfilModal, setPerfilModal] = useState('usuario');

  // Estado que gerencia o destino aberto
  const [destinoSelecionado, setDestinoSelecionado] = useState(null);
  const [modalDestinoVisible, setModalDestinoVisible] = useState(false);

  // Controle de Expansão dos Pilares (Accordion)
  const [pilarAberto, setPilarAberto] = useState(null);

  // Estados do formulário de Login
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [confirmarSenha, setConfirmarSenha] = useState('');
  
  // Estados da lista de destinos
  const [destinos, setDestinos] = useState([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todos');
  const [busca, setBusca] = useState('');

  // Estados para nova avaliação
  const [novoComentario, setNovoComentario] = useState('');
  const [novaNotaMotora, setNovaNotaMotora] = useState('5');
  const [novaNotaVisual, setNovaNotaVisual] = useState('5');

  // Estados para cadastrar local
  const [novoNome, setNovoNome] = useState('');
  const [novoEnd, setNovoEnd] = useState('');
  const [novoDesc, setNovoDesc] = useState('');
  const [novaCat, setNovaCat] = useState('Restaurante');

  // 🔄 Carregar dados vindos do Back-end Real
  const carregarDadosDoServidor = async () => {
    try {
      const loginSalvo = await AsyncStorage.getItem('tipoLogado');
      if (loginSalvo) setTipoLogado(loginSalvo);

      const resposta = await fetch(`${API_URL}/places`);
      
      if (!resposta.ok) {
        throw new Error(`Erro ${resposta.status} ao buscar lugares`);
      }

      const dadosServidor = await resposta.json();

      const destinosFormatados = dadosServidor.map(place => ({
        id: place.id.toString(),
        nome: place.establishment_name,
        categoria: place.category === 'ACCOMMODATION' ? 'Hospedagem' : 'Restaurante',
        endereco: place.full_address,
        desc: place.description,
        img: place.main_image,
        nMotora: place.accessibility_score,
        nVisual: 4.0,
        comentarios: []
      }));

      setDestinos(destinosFormatados);
    } catch (e) {
      console.log("Erro ao conectar com o servidor back-end:", e);
      Alert.alert("Erro de Conexão", "Não foi possível buscar os dados do servidor. Verifique se o IP está correto e se o server.js está ligado.");
    }
  };

  useEffect(() => {
    const iniciar = async () => {
      const usuarioSalvo = await AsyncStorage.getItem("usuario");
      if (usuarioSalvo) {
        const user = JSON.parse(usuarioSalvo);
        setUsuarioLogado(user);
        setTipoLogado(user.user_type === "BUSINESS" ? "empresa" : "usuario");
      }
      carregarDadosDoServidor();
    };
    iniciar();
  }, []);

  // Realizar o Login
  const lidarComAutenticacao = async () => {
    if (!email || !senha) {
      Alert.alert("Erro", "Preencha email e senha.");
      return;
    }

    try {
      const resposta = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: senha })
      });

      if (!resposta.ok) {
        const erroTexto = await resposta.text();
        throw new Error(erroTexto || `Erro ${resposta.status}`);
      }

      const dados = await resposta.json();

      if (!dados.success) {
        Alert.alert("Erro", dados.message || "Email ou senha inválidos");
        return;
      }

      await AsyncStorage.setItem("usuario", JSON.stringify(dados.user));
      setUsuarioLogado(dados.user);

      const tipo = dados.user_type === "BUSINESS" ? "empresa" : "usuario";
      setTipoLogado(tipo);

      Alert.alert("Sucesso", `Bem-vindo ${dados.user.username || dados.user.name || email}`);
      setModalVisible(false);
      setEmail('');
      setSenha('');

    } catch (erro) {
      console.log("Erro login:", erro);
      Alert.alert("Erro", erro.message.includes("Failed to fetch") || erro.message.includes("Network request failed")
        ? "Não foi possível conectar ao servidor. Verifique o IP and a rede." 
        : erro.message);
    }
  };

  // Criar Conta
  const criarConta = async () => {
    if (!nome || !email || !senha) {
      Alert.alert("Erro", "Preencha todos os campos.");
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert("Erro", "As senhas não coincidem.");
      return;
    }

    try {
      const resposta = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: nome,
          email,
          password: senha,
          userType: perfilModal === "empresa" ? "BUSINESS" : "TRAVELER"
        })
      });

      if (!resposta.ok) {
        const erroTexto = await resposta.text();
        throw new Error(erroTexto || `Erro ${resposta.status}`);
      }

      const dados = await resposta.json();

      if (!dados.success) {
        Alert.alert("Erro", dados.message);
        return;
      }

      Alert.alert("Sucesso", "Conta criada com sucesso! Faça o login agora.");
      setAbaModal("entrar");
      setNome('');
      setSenha('');
      setConfirmarSenha('');

    } catch (erro) {
      console.log("Erro register:", erro);
      Alert.alert("Erro", erro.message.includes("Failed to fetch") || erro.message.includes("Network request failed")
        ? "Falha ao conectar com o servidor." 
        : erro.message);
    }
  };

  // Logout
  const fazerLogout = async () => {
    await AsyncStorage.removeItem("usuario");
    await AsyncStorage.removeItem("tipoLogado");
    setUsuarioLogado(null);
    setTipoLogado(null);
    setTelaAtual("Inicio");
    Alert.alert("Logout", "Sessão encerrada.");
  };

  // Alternar Accordion dos Pilares
  const togglePilar = (pilar) => {
    setPilarAberto(pilarAberto === pilar ? null : pilar);
  };

  // Abrir detalhes do destino
  const abrirDetalhesDestino = (item) => {
    setDestinoSelecionado(item);
    setModalDestinoVisible(true);
  };

  // Adicionar Comentário/Avaliação
  const adicionarAvaliacao = async () => {
    if (!tipoLogado) {
      Alert.alert("Aviso", "Você precisa estar logado para avaliar.");
      setModalDestinoVisible(false);
      setModalVisible(true);
      return;
    }

    if (!novoComentario.trim()) {
      Alert.alert("Erro", "Escreva um comentário antes de enviar.");
      return;
    }

    const nM = parseFloat(novaNotaMotora) || 5;
    const nV = parseFloat(novaNotaVisual) || 5;

    const listaAtualizada = destinos.map(d => {
      if (d.id === destinoSelecionado.id) {
        const novosComentarios = [
          ...d.comentarios,
          {
            id: Math.random().toString(),
            usuario: usuarioLogado?.username || "Você",
            nota: Math.round((nM + nV) / 2),
            text: novoComentario
          }
        ];

        const mMotora = ((d.nMotora + nM) / 2).toFixed(1);
        const mVisual = ((d.nVisual + nV) / 2).toFixed(1);

        const destinoAtualizado = {
          ...d,
          comentarios: novosComentarios,
          nMotora: parseFloat(mMotora),
          nVisual: parseFloat(mVisual)
        };

        setDestinoSelecionado(destinoAtualizado);
        return destinoAtualizado;
      }
      return d;
    });

    setDestinos(listaAtualizada);
    setNovoComentario('');
    Alert.alert("Sucesso", "Obrigado pela sua avaliação!");
  };

  // Cadastrar Novo Estabelecimento (Painel Empresa)
  const cadastrarNovoLocal = async () => {
    if (!novoNome || !novoEnd || !novoDesc) {
      Alert.alert("Erro", "Preencha todos os campos do local.");
      return;
    }
    const novoItem = {
      id: Math.random().toString(),
      nome: novoNome,
      categoria: novaCat,
      endereco: novoEnd,
      desc: novoDesc,
      img: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500",
      nMotora: 4.5,
      nVisual: 4.0,
      comentarios: []
    };

    const listaAtualizada = [...destinos, novoItem];
    setDestinos(listaAtualizada);
    Alert.alert("Sucesso", "Estabelecimento publicado!");
    setNovoNome(''); 
    setNovoEnd(''); 
    setNovoDesc('');
    setTelaAtual('Destinos');
  };

  return (
    <View style={styles.container}>
      {/* HEADER GLOBAL */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoTextoAzul}>Viagens sem </Text>
          <Text style={styles.logoTextoEscuro}>Barreiras</Text>
        </View>

        {tipoLogado ? (
          <TouchableOpacity style={[styles.avatar, tipoLogado === 'empresa' ? styles.avatarEmpresa : styles.avatarUsuario]} onPress={() => {
            Alert.alert(
              "Minha Conta",
              `Logado como ${tipoLogado.toUpperCase()}`,
              [
                { text: "Cancelar", style: "cancel" },
                tipoLogado === 'empresa' ? { text: "Painel Empresa", onPress: () => setTelaAtual('Dashboard') } : null,
                { text: "Sair", onPress: fazerLogout, style: "destructive" }
              ].filter(Boolean)
            );
          }}>
            <Text style={styles.avatarText}>{tipoLogado === 'empresa' ? 'E' : 'U'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.btnEntrarHeader} onPress={() => setModalVisible(true)}>
            <Text style={styles.btnEntrarText}>Entrar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* CONTEÚDO DINÂMICO RENDERIZADO */}
      <ScrollView style={styles.conteudo}>
        {/* TELA: INÍCIO */}
        {telaAtual === 'Inicio' && (
          <View style={styles.containerInicio}>
            <View style={styles.cardHero}>
              <Feather name="compass" size={40} color="#ffffff" style={{ marginBottom: 15 }} />
              <Text style={styles.tituloBoasVindas}>Explore o mundo sem barreiras</Text>
              <Text style={styles.subtituloHero}>
                Encontre hotéis, restaurantes e pontos turísticos totalmente adaptados para o que você precisa.
              </Text>
            </View>

            <View style={styles.secaoRecursos}>
              <Text style={styles.tituloSecao}>Por que usar o app?</Text>
              <View style={styles.recursoItem}>
                <View style={styles.wrapperIcone}>
                  <Feather name="search" size={22} color="#0055ff" />
                </View>
                <View style={styles.recursoTextoContainer}>
                  <Text style={styles.recursoTitulo}>Busca Inteligente</Text>
                  <Text style={styles.recursoDesc}>Filtre os destinos por categorias e localizações.</Text>
                </View>
              </View>
              <View style={styles.recursoItem}>
                <View style={styles.wrapperIcone}>
                  <Feather name="award" size={22} color="#0055ff" />
                </View>
                <View style={styles.recursoTextoContainer}>
                  <Text style={styles.recursoTitulo}>Avaliações Reais</Text>
                  <Text style={styles.recursoDesc}>Notas específicas para acessibilidade motora e visual.</Text>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.btnPrincipalInicio} onPress={() => setTelaAtual('Destinos')}>
              <Text style={styles.btnPrincipalText}>Começar a Buscar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* TELA: DESTINOS */}
        {telaAtual === 'Destinos' && (
          <View style={{ padding: 15 }}>
            <View style={styles.searchSection}>
              <Feather style={styles.searchIcon} name="search" size={18} color="#64748b" />
              <TextInput
                style={styles.inputBuscaMinimalista}
                placeholder="Digite o nome ou endereço..."
                value={busca}
                onChangeText={setBusca}
              />
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 15 }}>
              {['Todos', 'Restaurante', 'Hospedagem', 'Ponto Turístico'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.btnFiltro, categoriaFiltro === cat && styles.btnFiltroAtivo]}
                  onPress={() => setCategoriaFiltro(cat)}
                >
                  <Text style={[styles.btnFiltroText, categoriaFiltro === cat && styles.btnFiltroTextAtivo]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {destinos
              .filter(d => (categoriaFiltro === 'Todos' || d.categoria === categoriaFiltro) && d.nome.toLowerCase().includes(busca.toLowerCase()))
              .map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  activeOpacity={0.9}
                  onPress={() => abrirDetalhesDestino(item)}
                >
                  <Image source={{ uri: item.img }} style={styles.cardImg} />
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTag}>{item.categoria}</Text>
                    <Text style={styles.cardTitulo}>{item.nome}</Text>
                    <View style={styles.inlineInfoRow}>
                      <Feather name="map-pin" size={13} color="#64748b" />
                      <Text style={styles.cardEnderecoMinimalista}>{item.endereco}</Text>
                    </View>
                    <Text style={styles.cardDesc}>{item.desc}</Text>
                    <View style={styles.badgeRow}>
                      <View style={styles.miniBadge}>
                        <Ionicons name="accessibility" size={14} color="#0055ff" />
                        <Text style={styles.miniBadgeText}> Motora: {item.nMotora}</Text>
                      </View>
                      <View style={styles.miniBadge}>
                        <Feather name="eye" size={14} color="#d97706" />
                        <Text style={styles.miniBadgeText}> Visual: {item.nVisual}</Text>
                      </View>
                      <View style={[styles.miniBadge, { marginLeft: 'auto', backgroundColor: '#e0eaff' }]}>
                        <Text style={[styles.miniBadgeText, { color: '#0055ff', fontWeight: '700' }]}>Ver Detalhes</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
          </View>
        )}

        {/* TELA: PILARES */}
        {telaAtual === 'Acessibilidade' && (
          <View style={{ padding: 20 }}>
            <Text style={styles.tituloPage}>Guia de Acessibilidade</Text>
            <Text style={[styles.subtituloPage, { textAlign: 'left', marginBottom: 20 }]}>
              Selecione uma das frentes para entender os critérios estruturais de inclusão urbana.
            </Text>

            {/* MOTOR */}
            <TouchableOpacity style={[styles.pilarBox, { borderLeftColor: '#0055ff' }, pilarAberto === 'motora' && styles.pilarAtivoBox]} onPress={() => togglePilar('motora')}>
              <View style={styles.pilarHeaderRow}>
                <View style={styles.pilarTituloComIcone}>
                  <Ionicons name="accessibility-outline" size={20} color="#0055ff" style={{ marginRight: 8 }} />
                  <Text style={styles.pilarTitulo}>Acessibilidade Motora</Text>
                </View>
                <Feather name={pilarAberto === 'motora' ? "chevron-up" : "chevron-down"} size={20} color="#64748b" />
              </View>
              <Text style={styles.pilarDescShort}>Garantia de livre circulação física e eliminação de barreiras arquitetônicas.</Text>
              {pilarAberto === 'motora' && (
                <View style={styles.pilarDropdown}>
                  <Text style={styles.pilarTopico}>• Infraestrutura: Rampas de acesso com inclinação padrão ABNT (NBR 9050), portas com vãos mínimos de 80cm e corredores amplos.</Text>
                  <Text style={styles.pilarTopico}>• Sanitários: Banheiros adaptados contendo barras de apoio firmes, bacia sanitária elevada e alarmes de emergência no chão.</Text>
                  <Text style={styles.pilarTopico}>• Mobiliário: Mesas e balcões com altura livre inferior para encaixe perfeito de cadeiras de rodas.</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* VISUAL */}
            <TouchableOpacity style={[styles.pilarBox, { borderLeftColor: '#d97706' }, pilarAberto === 'visual' && styles.pilarAtivoBox]} onPress={() => togglePilar('visual')}>
              <View style={styles.pilarHeaderRow}>
                <View style={styles.pilarTituloComIcone}>
                  <Feather name="eye" size={20} color="#d97706" style={{ marginRight: 8 }} />
                  <Text style={styles.pilarTitulo}>Acessibilidade Visual</Text>
                </View>
                <Feather name={pilarAberto === 'visual' ? "chevron-up" : "chevron-down"} size={20} color="#64748b" />
              </View>
              <Text style={styles.pilarDescShort}>Autonomia direcional, sinalização tátil e canais de comunicação alternativos.</Text>
              {pilarAberto === 'visual' && (
                <View style={styles.pilarDropdown}>
                  <Text style={styles.pilarTopico}>• Piso Tátil: Aplicação correta de pisos direcionais e de alerta.</Text>
                  <Text style={styles.pilarTopico}>• Comunicação: Textos em Braille em corrimãos, elevadores e cardápios turísticos digitais.</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* TELA: DASHBOARD */}
        {telaAtual === 'Dashboard' && (
          <View style={{ padding: 20 }}>
            <Text style={styles.tituloPage}>Painel da Empresa</Text>
            <Text style={styles.subtituloPage}>Cadastre o seu local no nosso mapa acessível</Text>
            <TextInput style={styles.inputForm} placeholder="Nome do Estabelecimento" value={novoNome} onChangeText={setNovoNome} />
            <TextInput style={styles.inputForm} placeholder="Endereço Completo" value={novoEnd} onChangeText={setNovoEnd} />
            <TextInput style={styles.inputForm} placeholder="Descrição das Acessibilidades" value={novoDesc} onChangeText={setNovoDesc} multiline />
            <TouchableOpacity style={styles.btnPrincipal} onPress={cadastrarNovoLocal}>
              <Text style={styles.btnPrincipalText}>Publicar Local</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* MODAL DETALHADO DO DESTINO */}
      <Modal visible={modalDestinoVisible} animationType="slide" transparent={false}>
        {destinoSelecionado && (
          <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <ScrollView>
              <Image source={{ uri: destinoSelecionado.img }} style={{ width: '100%', height: 240 }} />
              
              <TouchableOpacity 
                style={styles.btnFecharModalDestino} 
                onPress={() => setModalDestinoVisible(false)}
              >
                <Feather name="x" size={24} color="#ffffff" />
              </TouchableOpacity>

              <View style={{ padding: 20 }}>
                <Text style={styles.cardTag}>{destinoSelecionado.categoria}</Text>
                <Text style={[styles.cardTitulo, { fontSize: 24, marginVertical: 5 }]}>{destinoSelecionado.nome}</Text>
                
                <View style={[styles.inlineInfoRow, { marginBottom: 15 }]}>
                  <Feather name="map-pin" size={14} color="#64748b" />
                  <Text style={[styles.cardEnderecoMinimalista, { fontSize: 14 }]}>{destinoSelecionado.endereco}</Text>
                </View>

                <Text style={[styles.cardDesc, { fontSize: 15, lineHeight: 22, marginBottom: 20 }]}>{destinoSelecionado.desc}</Text>

                <View style={[styles.badgeRow, { paddingVertical: 10, borderBottomWidth: 1, borderColor: '#e2e8f0' }]}>
                  <View style={styles.miniBadge}>
                    <Ionicons name="accessibility" size={16} color="#0055ff" />
                    <Text style={styles.miniBadgeText}> Motora: {destinoSelecionado.nMotora}</Text>
                  </View>
                  <View style={styles.miniBadge}>
                    <Feather name="eye" size={16} color="#d97706" />
                    <Text style={styles.miniBadgeText}> Visual: {destinoSelecionado.nVisual}</Text>
                  </View>
                </View>

                {/* SEÇÃO DE COMENTÁRIOS */}
                <Text style={[styles.tituloSecao, { marginTop: 20 }]}>Avaliações da Comunidade</Text>
                {destinoSelecionado.comentarios.length === 0 ? (
                  <Text style={{ color: '#64748b', fontStyle: 'italic', marginVertical: 10 }}>Nenhuma avaliação ainda. Seja o primeiro a avaliar!</Text>
                ) : (
                  destinoSelecionado.comentarios.map(c => (
                    <View key={c.id} style={styles.cardComentario}>
                      <Text style={styles.comentarioUsuario}>{c.usuario} • ⭐ {c.nota}/5</Text>
                      <Text style={styles.comentarioTexto}>{c.texto}</Text>
                    </View>
                  ))
                )}

                {/* FORMULÁRIO DE NOVA AVALIAÇÃO */}
                <View style={styles.boxNovaAvaliacao}>
                  <Text style={styles.tituloNovaAvaliacao}>Deixe sua Avaliação</Text>
                  
                  <Text style={styles.labelNota}>Nota Acessibilidade Motora (1-5):</Text>
                  <TextInput style={styles.inputFormMinimalista} keyboardType="numeric" maxLength={1} value={novaNotaMotora} onChangeText={setNovaNotaMotora} />

                  <Text style={styles.labelNota}>Nota Acessibilidade Visual (1-5):</Text>
                  <TextInput style={styles.inputFormMinimalista} keyboardType="numeric" maxLength={1} value={novaNotaVisual} onChangeText={setNovaNotaVisual} />

                  <TextInput 
                    style={[styles.inputForm, { height: 80, textAlignVertical: 'top', marginTop: 10 }]} 
                    placeholder="Conte sua experiência sobre a acessibilidade do local..." 
                    value={novoComentario} 
                    onChangeText={setNovoComentario} 
                    multiline 
                  />

                  <TouchableOpacity style={styles.btnPrincipal} onPress={adicionarAvaliacao}>
                    <Text style={styles.btnPrincipalText}>Enviar Comentário</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* MODAL DE AUTENTICAÇÃO (LOGIN / CADASTRO) */}
      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <View style={styles.fundoModalFocused}>
          <View style={styles.containerCardModal}>
            
            {/* ABAS DO MODAL */}
            <View style={styles.linhaAbasModal}>
              <TouchableOpacity style={[styles.abaBotao, abaModal === 'entrar' && styles.abaBotaoAtivo]} onPress={() => setAbaModal('entrar')}>
                <Text style={[styles.abaBotaoTexto, abaModal === 'entrar' && styles.abaBotaoTextoAtivo]}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.abaBotao, abaModal === 'cadastrar' && styles.abaBotaoAtivo]} onPress={() => setAbaModal('cadastrar')}>
                <Text style={[styles.abaBotaoTexto, abaModal === 'cadastrar' && styles.abaBotaoTextoAtivo]}>Cadastro</Text>
              </TouchableOpacity>
            </View>

            {/* FORMULÁRIO DE LOGIN */}
            {abaModal === 'entrar' ? (
              <View style={{ width: '100%', marginTop: 15 }}>
                <TextInput style={styles.inputForm} placeholder="E-mail" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
                <TextInput style={styles.inputForm} placeholder="Senha" secureTextEntry value={senha} onChangeText={setSenha} />
                <TouchableOpacity style={styles.btnPrincipal} onPress={lidarComAutenticacao}>
                  <Text style={styles.btnPrincipalText}>Entrar</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* FORMULÁRIO DE CADASTRO */
              <View style={{ width: '100%', marginTop: 15 }}>
                <TextInput style={styles.inputForm} placeholder="Nome Completo / Razão Social" value={nome} onChangeText={setNome} />
                <TextInput style={styles.inputForm} placeholder="E-mail" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
                <TextInput style={styles.inputForm} placeholder="Senha" secureTextEntry value={senha} onChangeText={setSenha} />
                <TextInput style={styles.inputForm} placeholder="Confirmar Senha" secureTextEntry value={confirmarSenha} onChangeText={setConfirmarSenha} />
                
                {/* SELEÇÃO DE TIPO DE PERFIL */}
                <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 5 }}>Tipo de Perfil:</Text>
                <View style={{ flexDirection: 'row', marginBottom: 15, justifyContent: 'space-between' }}>
                  <TouchableOpacity style={[styles.btnRadioSelector, perfilModal === 'usuario' && styles.btnRadioSelectorAtivo]} onPress={() => setPerfilModal('usuario')}>
                    <Text style={[styles.btnRadioText, perfilModal === 'usuario' && styles.btnRadioTextAtivo]}>Viajante</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btnRadioSelector, perfilModal === 'empresa' && styles.btnRadioSelectorAtivo]} onPress={() => setPerfilModal('empresa')}>
                    <Text style={[styles.btnRadioText, perfilModal === 'empresa' && styles.btnRadioTextAtivo]}>Empresa</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.btnPrincipal} onPress={criarConta}>
                  <Text style={styles.btnPrincipalText}>Cadastrar Conta</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={styles.btnFecharModalTexto} onPress={() => setModalVisible(false)}>
              <Text style={{ color: '#ef4444', fontWeight: '600' }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MENU DE NAVEGAÇÃO INFERIOR */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navItem} onPress={() => setTelaAtual('Inicio')}>
          <Feather name="home" size={20} color={telaAtual === 'Inicio' ? '#0055ff' : '#64748b'} />
          <Text style={[styles.navText, telaAtual === 'Inicio' && styles.navTextAtivo]}>Início</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setTelaAtual('Destinos')}>
          <Feather name="map" size={20} color={telaAtual === 'Destinos' ? '#0055ff' : '#64748b'} />
          <Text style={[styles.navText, telaAtual === 'Destinos' && styles.navTextAtivo]}>Destinos</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setTelaAtual('Acessibilidade')}>
          <Feather name="shield" size={20} color={telaAtual === 'Acessibilidade' ? '#0055ff' : '#64748b'} />
          <Text style={[styles.navText, telaAtual === 'Acessibilidade' && styles.navTextAtivo]}>Guia NBR</Text>
        </TouchableOpacity>

        {tipoLogado === 'empresa' && (
          <TouchableOpacity style={styles.navItem} onPress={() => setTelaAtual('Dashboard')}>
            <Feather name="sliders" size={20} color={telaAtual === 'Dashboard' ? '#0055ff' : '#64748b'} />
            <Text style={[styles.navText, telaAtual === 'Dashboard' && styles.navTextAtivo]}>Painel</Text>
          </TouchableOpacity>
        )}
      </View>

    </View>
  );
}