import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Linking, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// --- CONFIGURAÇÃO FIREBASE MASTER 0 ---
import { getApps, initializeApp } from 'firebase/app';
import { doc, getFirestore, increment, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyBtX_GcH_-6xPC8NbjmaOuqFI_qZ_yMB68",
  authDomain: "master0casino.firebaseapp.com",
  projectId: "master0casino",
  storageBucket: "master0casino.firebasestorage.app",
  messagingSenderId: "250319792354",
  appId: "1:250319792354:web:75afc1b52b2f27a8c756bb",
  measurementId: "G-MSVWVWFX7B"
};

if (!getApps().length) initializeApp(firebaseConfig);
const db = getFirestore();
const functions = getFunctions();

const { width, height } = Dimensions.get('window');

const CartaMaster = ({ valor, isOculta = false }: any) => {
  const anim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const naipes = [{ s: '♥', c: '#ff4d4d' }, { s: '♦', c: '#ff4d4d' }, { s: '♣', c: '#222' }, { s: '♠', c: '#222' }];
  const naipeRef = useRef(naipes[Math.floor(Math.random() * naipes.length)]).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 1500, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  if (isOculta) return (
    <Animated.View style={[styles.card, styles.cardBack, { transform: [{ scale: anim }, { translateY: floatAnim }] }]}>
      <Text style={styles.cardBackLogo}>?</Text>
    </Animated.View>
  );

  const label = valor === 0.5 ? '½' : valor;
  return (
    <Animated.View style={[styles.card, { opacity: anim, transform: [{ scale: anim }, { translateY: floatAnim }] }]}>
      <View style={styles.cardCorner}><Text style={[styles.cardV, {color: naipeRef.c}]}>{label}</Text><Text style={[styles.cardSuitSmall, {color: naipeRef.c}]}>{naipeRef.s}</Text></View>
      <View style={styles.centerWrapper}><Text style={[styles.cardCenter, {color: naipeRef.c}]}>{valor === 0.5 ? '👑' : naipeRef.s}</Text></View>
      <View style={[styles.cardCorner, styles.cardCornerBottom]}>
        <Text style={[styles.cardV, {color: naipeRef.c}]}>{label}</Text>
        <Text style={[styles.cardSuitSmall, {color: naipeRef.c}]}>{naipeRef.s}</Text>
      </View>
    </Animated.View>
  );
};

const JackpotDisplay = ({ valor, progresso }: any) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.jackpotBox, { transform: [{ scale: pulseAnim }] }]}>
      <Text style={styles.jackpotTitle}>🔥 JACKPOT MASTER 0 🔥</Text>
      <Text style={styles.jackpotValue}>$ {valor.toFixed(2)}</Text>
      <View style={styles.progressContainer}>
        {[1, 2, 3].map(i => (
          <View key={i} style={[styles.progressDot, i <= progresso ? styles.progressDotActive : null]} />
        ))}
      </View>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const [jogador, setJogador] = useState(0);
  const [maoJogador, setMaoJogador] = useState<any[]>([]); 
  const [banca, setBanca] = useState(0);
  const [maoBanca, setMaoBanca] = useState<any[]>([]); 
  const [resultado, setResultado] = useState('');
  const [reacao, setReacao] = useState<any>(null);
  const [fim, setFim] = useState(false);
  const [fichas, setFichas] = useState(0);
  const [aposta, setAposta] = useState<number | null>(null);
  const [valorLivre, setValorLivre] = useState('');
  const [primeiraCartaDistribuida, setPrimeiraCartaDistribuida] = useState(false);
  const [valorAumento, setValorAumento] = useState('');
  const [bancaJogando, setBancaJogando] = useState(false);
  const [bloqueioCompra, setBloqueioCompra] = useState(false);
  const [jackpot, setJackpot] = useState(100.00);
  const [progressoJackpot, setProgressoJackpot] = useState(1);
  const [mostrarLoja, setMostrarLoja] = useState(false);
  const [valorCompraPersonalizada, setValorCompraPersonalizada] = useState('');

  const monteRef = useRef<number[]>([]);
  const userUID = "Master0_Player_Official"; 

  useEffect(() => {
    const userDoc = doc(db, "usuarios", userUID);
    const unsub = onSnapshot(userDoc, (snap) => {
      if (snap.exists()) setFichas(snap.data().saldo);
      else setDoc(userDoc, { saldo: 1000 });
    });
    return () => unsub();
  }, []);

  const irParaPagamento = async (valorFichas: number) => {
    if (!valorFichas || valorFichas <= 0) {
      Alert.alert("Erro", "Insira um valor válido.");
      return;
    }
    const criarCheckout = httpsCallable(functions, 'criarCheckout');
    try {
      dispararReacao("GERANDO PIX...", "#ffd700");
      const resp: any = await criarCheckout({ amount: valorFichas, userId: userUID });
      if (resp.data.init_point) Linking.openURL(resp.data.init_point);
    } catch (err) { 
      Alert.alert("Loja", "Erro ao conectar com o financeiro."); 
    }
  };

  const dispararReacao = (msg: string, cor: string = '#ffd700') => {
    setReacao({ msg, cor });
    setTimeout(() => setReacao(null), 2500);
  };

  function tirarCarta() {
    if (monteRef.current.length < 10) {
      let novo: number[] = [];
      [1, 2, 3, 4, 5, 6, 7].forEach(c => { for (let j = 0; j < 8; j++) novo.push(c); });
      for (let j = 0; j < 24; j++) novo.push(0.5); 
      monteRef.current = novo.sort(() => Math.random() - 0.5);
    }
    return monteRef.current.pop() ?? 0.5;
  }

  async function validarEApostar(valor: number) {
    if (fim || aposta !== null || valor <= 0 || valor > fichas) return;
    await updateDoc(doc(db, "usuarios", userUID), { saldo: increment(-valor) });
    setAposta(valor);
    dispararReacao(`APOSTOU $${valor}`, '#0f0');
  }

  function blefarAumentar() {
    const v = Number(valorAumento);
    if (isNaN(v) || v <= 0 || v > fichas || aposta === null) return;
    updateDoc(doc(db, "usuarios", userUID), { saldo: increment(-v) });
    setAposta((aposta || 0) + v);
    setValorAumento('');
    setBloqueioCompra(true);
    dispararReacao("BLEFE!", '#ff4d4d');
  }

  async function finalizar(ganho: number, msg: string, rMsg: string, rCor: string) {
    if (ganho > 0) await updateDoc(doc(db, "usuarios", userUID), { saldo: increment(ganho) });
    setResultado(msg);
    dispararReacao(rMsg, rCor);
    setFim(true);
  }

  function comprarCartaJogador() {
    if (fim || aposta === null || bancaJogando || bloqueioCompra) return;
    const carta = tirarCarta();
    const novaMao = [...maoJogador, carta];
    const total = jogador + carta;
    setJogador(total);
    setMaoJogador(novaMao);
    if (total > 7.5) finalizar(0, '💥 ESTOUROU!', 'PERDEU!', '#ff4d4d');
    else if (total === 7.5) {
      const isOriginal = novaMao.length === 2 && novaMao.includes(7) && novaMao.includes(0.5);
      finalizar(aposta! * (isOriginal ? 4 : 3), isOriginal ? '🃏 7.5 ORIGINAL!' : '🎯 7.5!', 'MASTER!', '#d4af37');
    }
  }

  async function ficar() {
    if (fim || aposta === null || bancaJogando) return;
    setBancaJogando(true);
    let tB = 0; let mB: number[] = [];
    while (tB < 7.5 && tB <= jogador) {
      dispararReacao("BANCA PENSANDO...", "#fff");
      await new Promise(r => setTimeout(r, 1200));
      const c = tirarCarta(); tB += c; mB.push(c);
      setBanca(tB); setMaoBanca([...mB]);
    }
    await new Promise(r => setTimeout(r, 500));
    if (tB > 7.5 || tB < jogador) finalizar(aposta! * 2, '✅ VITÓRIA!', 'GANHOU!', '#0f0');
    else finalizar(0, '🏦 BANCA VENCEU', 'PERDEU!', '#ff4d4d');
    setBancaJogando(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.pill}><Text style={styles.pillT}>CARTEIRA: ${fichas}</Text></View>
        <View style={[styles.pill, {borderColor: '#0f0'}]}><Text style={[styles.pillT, {color: '#0f0'}]}>APOSTA: ${aposta ?? 0}</Text></View>
      </View>

      <View style={styles.tableArea}>
        <View style={styles.felt}>
          {reacao && (
            <View style={styles.reacaoAbs}>
              <Text style={[styles.reacaoT, {color: reacao.cor}]}>{reacao.msg}</Text>
            </View>
          )}
          <View style={styles.cardRow}>
            {primeiraCartaDistribuida && maoBanca.length === 0 && !fim ? <CartaMaster isOculta={true} /> : maoBanca.map((c, i) => <CartaMaster key={i} valor={c} />)}
          </View>
          {fim && <View style={styles.msgFim}><Text style={styles.msgFimT}>{resultado}</Text></View>}
          <View style={styles.playerSection}>
            <View style={styles.cardRow}>{maoJogador.map((c, i) => <CartaMaster key={i} valor={c} />)}</View>
            <Text style={styles.scoreT}>VOCÊ: {jogador.toFixed(1)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.sidebar}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{alignItems: 'center', paddingBottom: 40}}>
          <TouchableOpacity style={styles.btnLoja} onPress={() => setMostrarLoja(!mostrarLoja)}>
            <Text style={styles.btnLojaT}>{mostrarLoja ? "VOLTAR" : "🛒 LOJA"}</Text>
          </TouchableOpacity>

          {mostrarLoja ? (
            <View style={styles.lojaContainer}>
              <Text style={styles.lojaTitle}>DEPÓSITO RÁPIDO</Text>
              <TouchableOpacity style={styles.btnItemLoja} onPress={() => irParaPagamento(1000)}>
                <Text style={styles.btnItemLojaT}>$ 1.000</Text>
                <Text style={styles.btnItemLojaSub}>R$ 10,00</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnItemLoja} onPress={() => irParaPagamento(5000)}>
                <Text style={styles.btnItemLojaT}>$ 5.000</Text>
                <Text style={styles.btnItemLojaSub}>R$ 40,00</Text>
              </TouchableOpacity>
              <View style={styles.compraLivreBox}>
                <Text style={styles.compraLivreLabel}>VALOR LIVRE ($)</Text>
                <TextInput 
                  style={styles.inputLoja} keyboardType="numeric" 
                  value={valorCompraPersonalizada} onChangeText={setValorCompraPersonalizada}
                  placeholder="Ex: 2500" placeholderTextColor="#666"
                />
                <TouchableOpacity style={styles.btnComprarLivre} onPress={() => irParaPagamento(Number(valorCompraPersonalizada))}>
                  <Text style={styles.btnComprarLivreT}>COMPRAR</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={{width: '100%', alignItems: 'center'}}>
              {!fim ? (
                <>
                  {aposta === null && (
                    <View style={styles.controlesAposta}>
                      <View style={styles.chipsRow}>
                        {[10, 50, 100].map(v => (
                          <TouchableOpacity key={v} style={styles.chip} onPress={() => validarEApostar(v)}><Text style={styles.chipT}>{v}</Text></TouchableOpacity>
                        ))}
                      </View>
                      <TextInput style={styles.inputBet} keyboardType="numeric" value={valorLivre} onChangeText={setValorLivre} placeholder="Valor" placeholderTextColor="#999" />
                      <TouchableOpacity style={styles.btnConfirm} onPress={() => validarEApostar(Number(valorLivre))}><Text style={styles.btnConfirmT}>APOSTAR</Text></TouchableOpacity>
                    </View>
                  )}
                  {aposta !== null && !primeiraCartaDistribuida && (
                    <TouchableOpacity style={styles.btnPlay} onPress={() => {const c=tirarCarta(); setJogador(c); setMaoJogador([c]); setPrimeiraCartaDistribuida(true);}}>
                      <Text style={styles.btnPlayT}>INICIAR</Text>
                    </TouchableOpacity>
                  )}
                  {primeiraCartaDistribuida && (
                    <View style={{gap: 15, width: '100%', alignItems: 'center'}}>
                      {!bloqueioCompra && <TouchableOpacity style={styles.btnHit} onPress={comprarCartaJogador}><Text style={styles.btnHitT}>+ CARTA</Text></TouchableOpacity>}
                      <TouchableOpacity style={styles.btnStay} onPress={ficar}><Text style={styles.btnStayT}>FICAR</Text></TouchableOpacity>
                      <View style={styles.bluffBox}>
                        <TextInput style={styles.inputBluff} keyboardType="numeric" value={valorAumento} onChangeText={setValorAumento} placeholder="Blefe" placeholderTextColor="#999" />
                        <TouchableOpacity style={styles.btnBluffAction} onPress={blefarAumentar}><Text style={styles.btnBluffActionT}>AUMENTAR</Text></TouchableOpacity>
                      </View>
                    </View>
                  )}
                </>
              ) : (
                <TouchableOpacity style={styles.btnPlay} onPress={() => {setJogador(0);setMaoJogador([]);setBanca(0);setMaoBanca([]);setResultado('');setFim(false);setAposta(null);setPrimeiraCartaDistribuida(false);setBloqueioCompra(false);}}>
                  <Text style={styles.btnPlayT}>REPETIR</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </View>
      <View style={styles.jackpotPos}><JackpotDisplay valor={jackpot} progresso={progressoJackpot} /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', flexDirection: 'row' },
  header: { position: 'absolute', top: 30, left: 0, width: width-180, flexDirection: 'row', justifyContent: 'center', gap: 15, zIndex: 100 },
  pill: { backgroundColor: '#111', padding: 10, borderRadius: 20, borderWidth: 2, borderColor: '#d4af37', minWidth: 120, alignItems: 'center' },
  pillT: { color: '#d4af37', fontWeight: 'bold' },
  tableArea: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  felt: { width: (width-180)*0.95, height: height*0.8, backgroundColor: '#07321a', borderRadius: 150, borderWidth: 10, borderColor: '#3d2b1f', justifyContent: 'space-around', alignItems: 'center' },
  cardRow: { flexDirection: 'row', gap: 10, minHeight: 120, justifyContent: 'center', alignItems: 'center' },
  playerSection: { alignItems: 'center' },
  scoreT: { color: '#ffd700', fontWeight: 'bold', fontSize: 20, marginTop: 15 },
  sidebar: { width: 180, backgroundColor: '#0a0a0a', borderLeftWidth: 2, borderColor: '#d4af37', paddingTop: 60 },
  btnLoja: { backgroundColor: '#ffd700', padding: 12, borderRadius: 10, marginBottom: 30, width: '85%' },
  btnLojaT: { textAlign: 'center', fontWeight: 'bold', color: '#000' },
  lojaContainer: { width: '100%', alignItems: 'center', gap: 12 },
  lojaTitle: { color: '#fff', fontWeight: 'bold', fontSize: 12, marginBottom: 5 },
  btnItemLoja: { backgroundColor: '#111', width: '90%', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#ffd700', alignItems: 'center' },
  btnItemLojaT: { color: '#ffd700', fontWeight: 'bold', fontSize: 16 },
  btnItemLojaSub: { color: '#0f0', fontSize: 11, marginTop: 2 },
  compraLivreBox: { width: '90%', marginTop: 20, backgroundColor: '#1a1a1a', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#333' },
  compraLivreLabel: { color: '#aaa', fontSize: 10, textAlign: 'center', marginBottom: 5 },
  inputLoja: { backgroundColor: '#fff', borderRadius: 5, height: 35, textAlign: 'center', color: '#000', fontWeight: 'bold' },
  btnComprarLivre: { backgroundColor: '#28a745', marginTop: 10, padding: 10, borderRadius: 5 },
  btnComprarLivreT: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 12 },
  controlesAposta: { width: '100%', alignItems: 'center', gap: 10 },
  chipsRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  chip: { backgroundColor: '#222', width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#ffd700' },
  chipT: { color: '#ffd700', fontWeight: 'bold', fontSize: 13 },
  inputBet: { backgroundColor: '#fff', width: '85%', height: 45, borderRadius: 8, textAlign: 'center', color: '#000' },
  btnConfirm: { backgroundColor: '#d4af37', padding: 15, borderRadius: 8, width: '85%' },
  btnConfirmT: { textAlign: 'center', fontWeight: 'bold' },
  btnPlay: { width: 110, height: 110, borderRadius: 55, backgroundColor: '#ff8c00', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#fff' },
  btnPlayT: { color: '#fff', fontWeight: 'bold' },
  btnHit: { backgroundColor: '#007bff', padding: 18, borderRadius: 12, width: 150 },
  btnHitT: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  btnStay: { backgroundColor: '#28a745', padding: 18, borderRadius: 12, width: 150 },
  btnStayT: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  bluffBox: { width: 150, marginTop: 15 },
  inputBluff: { backgroundColor: '#fff', height: 40, borderRadius: 8, textAlign: 'center', marginBottom: 8, color: '#000' },
  btnBluffAction: { backgroundColor: '#ff4d4d', padding: 12, borderRadius: 8 },
  btnBluffActionT: { color: '#fff', textAlign: 'center', fontWeight: 'bold', fontSize: 11 },
  jackpotPos: { position: 'absolute', bottom: 30, left: 30, zIndex: 100 },
  jackpotBox: { backgroundColor: '#111', padding: 15, borderRadius: 25, borderWidth: 3, borderColor: '#ffd700', alignItems: 'center' },
  jackpotTitle: { color: '#ff4d4d', fontSize: 12, fontWeight: 'bold' },
  jackpotValue: { color: '#ffd700', fontSize: 32, fontWeight: '900' },
  progressContainer: { flexDirection: 'row', gap: 8, marginTop: 10 },
  progressDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#333' },
  progressDotActive: { backgroundColor: '#ffd700' },
  reacaoAbs: { position: 'absolute', top: '40%', zIndex: 999, width: '100%' },
  reacaoT: { fontSize: 45, fontWeight: '900', textAlign: 'center', textShadowColor: '#000', textShadowRadius: 15 },
  card: { width: 80, height: 115, backgroundColor: '#fff', borderRadius: 12, padding: 8, justifyContent: 'space-between' },
  cardBack: { backgroundColor: '#8b0000', borderWidth: 5, borderColor: '#fff' },
  cardBackLogo: { fontSize: 40, color: '#fff', fontWeight: 'bold' },
  cardCorner: { width: '45%' }, cardCornerBottom: { alignSelf: 'flex-end', transform: [{ rotate: '180deg' }] },
  cardV: { fontSize: 18, fontWeight: 'bold' }, cardSuitSmall: { fontSize: 14 },
  centerWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' }, cardCenter: { fontSize: 40 },
  msgFim: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.95)', padding: 35, borderRadius: 25, borderWidth: 4, borderColor: '#ffd700', zIndex: 999, top: '30%', minWidth: 260 },
  msgFimT: { color: '#ffd700', fontWeight: 'bold', fontSize: 28, textAlign: 'center' }
});