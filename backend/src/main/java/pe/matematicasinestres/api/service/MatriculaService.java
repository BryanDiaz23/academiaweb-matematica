package pe.matematicasinestres.api.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.matematicasinestres.api.dto.MatriculaDto;
import pe.matematicasinestres.api.dto.MatriculaAdminRequest;
import pe.matematicasinestres.api.dto.MatriculaEstadoRequest;
import pe.matematicasinestres.api.dto.MatriculaRequest;
import pe.matematicasinestres.api.entity.EstadoMatricula;
import pe.matematicasinestres.api.entity.Matricula;
import pe.matematicasinestres.api.entity.Rol;
import pe.matematicasinestres.api.exception.ApiException;
import pe.matematicasinestres.api.repository.HorarioRepository;
import pe.matematicasinestres.api.repository.MatriculaRepository;
import pe.matematicasinestres.api.repository.NivelRepository;
import pe.matematicasinestres.api.repository.UsuarioRepository;

import java.time.LocalDate;
import java.util.EnumSet;
import java.util.List;

@Service
public class MatriculaService {

    private final MatriculaRepository matriculas;
    private final UsuarioRepository usuarios;
    private final NivelRepository niveles;
    private final HorarioRepository horarios;

    public MatriculaService(MatriculaRepository matriculas, UsuarioRepository usuarios, NivelRepository niveles,
                            HorarioRepository horarios) {
        this.matriculas = matriculas;
        this.usuarios = usuarios;
        this.niveles = niveles;
        this.horarios = horarios;
    }

    /** El alumno solo ve SUS matrículas: el id sale del token, nunca de la URL. */
    @Transactional(readOnly = true)
    public List<MatriculaDto> misMatriculas(Long usuarioId) {
        return matriculas.findByUsuarioIdOrderByCreadoEnDesc(usuarioId).stream().map(MatriculaDto::from).toList();
    }

    @Transactional
    public MatriculaDto solicitar(Long usuarioId, MatriculaRequest req) {
        var nivel = niveles.findById(req.nivelId()).orElseThrow(() -> ApiException.noEncontrado("Nivel"));
        var horario = horarios.findById(req.horarioId()).orElseThrow(() -> ApiException.noEncontrado("Horario"));
        if (matriculas.existsByUsuarioIdAndNivelIdAndEstadoIn(usuarioId, nivel.getId(),
                EnumSet.of(EstadoMatricula.PENDIENTE, EstadoMatricula.ACTIVA))) {
            throw new ApiException(HttpStatus.CONFLICT, "Ya tienes una matrícula pendiente o activa en este nivel.");
        }
        Matricula m = new Matricula();
        m.setUsuario(usuarios.findById(usuarioId).orElseThrow(() -> ApiException.noEncontrado("Usuario")));
        m.setNivel(nivel);
        m.setHorario(horario);
        m.setEstado(EstadoMatricula.PENDIENTE);
        return MatriculaDto.from(matriculas.save(m));
    }

    /**
     * Alta manual hecha por el administrador: la matrícula nace ACTIVA, vigente desde hoy
     * por el número de meses indicado (1 por defecto). Solo para cuentas con rol ALUMNO.
     */
    @Transactional
    public MatriculaDto crearComoAdmin(MatriculaAdminRequest req) {
        var alumno = usuarios.findById(req.usuarioId()).orElseThrow(() -> ApiException.noEncontrado("Usuario"));
        if (!Rol.ALUMNO.equals(alumno.getRol().getNombre())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Solo se puede matricular a cuentas con rol ALUMNO.");
        }
        var nivel = niveles.findById(req.nivelId()).orElseThrow(() -> ApiException.noEncontrado("Nivel"));
        var horario = horarios.findById(req.horarioId()).orElseThrow(() -> ApiException.noEncontrado("Horario"));
        if (matriculas.existsByUsuarioIdAndNivelIdAndEstadoIn(alumno.getId(), nivel.getId(),
                EnumSet.of(EstadoMatricula.PENDIENTE, EstadoMatricula.ACTIVA))) {
            throw new ApiException(HttpStatus.CONFLICT, "El alumno ya tiene una matrícula pendiente o activa en este nivel.");
        }
        int meses = req.meses() == null ? 1 : req.meses();
        Matricula m = new Matricula();
        m.setUsuario(alumno);
        m.setNivel(nivel);
        m.setHorario(horario);
        m.setEstado(EstadoMatricula.ACTIVA);
        m.setFechaInicio(LocalDate.now());
        m.setFechaFin(LocalDate.now().plusMonths(meses));
        return MatriculaDto.from(matriculas.save(m));
    }

    @Transactional(readOnly = true)
    public List<MatriculaDto> listarTodas() {
        return matriculas.findAllByOrderByCreadoEnDesc().stream().map(MatriculaDto::from).toList();
    }

    @Transactional
    public MatriculaDto cambiarEstado(Long id, MatriculaEstadoRequest req) {
        Matricula m = matriculas.findById(id).orElseThrow(() -> ApiException.noEncontrado("Matrícula"));
        LocalDate inicio = req.fechaInicio() != null ? req.fechaInicio() : m.getFechaInicio();
        LocalDate fin = req.fechaFin() != null ? req.fechaFin() : m.getFechaFin();
        if (req.estado() == EstadoMatricula.ACTIVA && req.fechaFin() == null
                && (fin == null || fin.isBefore(LocalDate.now()))) {
            // Activación nueva o renovación de una matrícula vencida: un mes desde hoy
            inicio = req.fechaInicio() != null ? req.fechaInicio() : LocalDate.now();
            fin = inicio.plusMonths(1);
        }
        if (req.estado() == EstadoMatricula.ACTIVA && inicio == null) {
            inicio = LocalDate.now();
        }
        if (inicio != null && fin != null && fin.isBefore(inicio)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "La fecha de fin no puede ser anterior a la fecha de inicio.");
        }
        m.setEstado(req.estado());
        m.setFechaInicio(inicio);
        m.setFechaFin(fin);
        return MatriculaDto.from(matriculas.save(m));
    }
}
